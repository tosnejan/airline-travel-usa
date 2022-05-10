import React from "react";
import * as d3 from "d3";
import us from "../data/us.json";
import dataFile from "../data/airports.json";
import { difference, dot, size } from "../utils";

const MAP = "us-states"
const AIRPORTS = "airports"
const FLIGHTS = "flights"

class USMap extends React.Component {
  constructor(props) {
    super(props);
    this.svg = null
    this.state = {
      geoPath: d3.geoPath().projection(props.projection),
    }
    this.airportsInfo = [];
    for (const key in dataFile) {
			if (dataFile[key].iata !== null && dataFile[key].iata !== '' && dataFile[key].iata !== '0') {
				this.airportsInfo.push(dataFile[key]);
			}
		}
  }

  drawUSMap = () => {
    d3.select(`#${MAP}`)
      .selectAll("path")
      .data(us.features.filter(f => f.properties.NAME !== "Alaska" && f.properties.NAME !== "Hawaii" && f.properties.NAME !== "Puerto Rico"))
      .join("path")
      .attr("id", (d) => d.properties.NAME)
      .attr("d", this.state.geoPath)
      .append("title").text((d) => d.properties.NAME);
  }

  drawFlightGraph = () => {
    const { airports, flights, maxSize, highlighted, airportID} = this.props;
    const drawFlight = d3.line().curve(d3.curveLinear);

    const flightsSVG = d3.select(`#${FLIGHTS}`)
      .selectAll("path")
      .data(flights)
      .join("path")
      .attr("d", d => drawFlight(d.points))
      .attr('fill', 'none')
      .style("stroke", (d) => {
        const dir = difference(airports[d.A].pos, airports[d.B].pos)
        const i = (1 + dot(dir , [1, 0])/size(dir))/2
        d.color = d3.interpolateRainbow(i)
        return d.color
      });


    for (let i = 0; i < airports.length; i++) {
      const airport = airports[i]
      airport.routes = flightsSVG.filter(d => d.A === airport.id || d.B === airport.id)
      airport.routesInverse = flightsSVG.filter(d => d.A !== airport.id && d.B !== airport.id)
    }

    const airportsSVG = d3.select(`#${AIRPORTS}`)
      .selectAll("circle")
      .data(airports)
      .join("circle")
      .attr("r", (d) => Math.sqrt(d.size / Math.PI)*2)
      .attr("cx", (d) => d.pos[0])
      .attr("cy", (d) => d.pos[1])
      .classed("highlighted", true)
      .style("fill", (d) => {
        d.color = d3.interpolateViridis((d.size - 1) / maxSize)
        return d.color
      })
      .on("mouseover", function(e,d) {
        d3.select(this).style("fill", "red");
        //d.routes.style("stroke", "red")
        d.routesInverse.style("stroke", "grey");
        d.routesInverse.style("opacity", 0.1);
      })                  
      .on("mouseout", function(e, d) {
        console.log(d.id)
        if(d.id !== airportID) d3.select(this).style("fill", d.color);
        // d.routes.style("stroke", (l) => l.color)
        if(airportID === -1) d.routesInverse.style("opacity", 1);
        else {
          let routes = flightsSVG.filter(d => highlighted.includes(d.id));
          routes.style("stroke", "red");
          routes.style("opacity", 1);
          routes.style("stroke-width", 1);
          routes.raise();
        }
      }).on("click", (e) => {
        let name = e.target.firstChild.textContent;
        window.location.hash = name.replaceAll(' ', '+');
      }

      )
      .append("title").text((d) => this.airportsInfo.find(el => el.iata === d.code).name);
    this.highlight(flightsSVG, airportsSVG);
  }

  highlight(flightsSVG, airportsSVG){
    const { highlighted, airportID } = this.props;
    if(airportID !== -1){
      d3.select(`#${AIRPORTS}`)
      .selectAll("circle").filter(d => d.id === airportID).style("fill", "red");
    }
    if(highlighted === undefined) return;
    if(highlighted.length === 0) {
      flightsSVG.style("stroke", "grey");
      flightsSVG.style("opacity", 0.1);
    } else if(highlighted.length === 1 && highlighted[0] === -1) {
      flightsSVG.style("stroke", (l) => l.color);
      flightsSVG.style("opacity", 1);
    } else {
      let routes = flightsSVG.filter(d => highlighted.includes(d.id));
      let routesInverse = flightsSVG.filter(d => !highlighted.includes(d.id));
      routes.style("stroke", "red");
      routes.style("opacity", 1);
      routes.style("stroke-width", 1);
      routes.raise();
      routesInverse.style("stroke", "grey");
      routesInverse.style("opacity", 0.1);
    }
  }

  componentDidMount() {
    const root = this.svg.append("g");
    this.zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => {
        const { transform } = event;
        root.attr("transform", transform);
        root.attr("stroke-width", 1 / transform.k);
      });
    
    root.append("g").attr("id", MAP).classed("us-map", true);
    const airData = root.append("g").attr("id", "air-travel")
    airData.append("g").attr("id", FLIGHTS).classed("flights", true);
    airData.append("g").attr("id", AIRPORTS).classed("airports", true);

    this.drawUSMap()
    this.drawFlightGraph()
    
    // Set initial offset to center
    const map = document.querySelector('#visualization')
    const {x, y, width: wBB, height: hBB } = map.getBBox()
    const {width, height} = getComputedStyle(map)

    const offsetX = -x + (parseInt(width.replace('px', '')) - wBB)/2;
    const offsetY = -y + (parseInt(height.replace('px', ''))  - hBB)/2;

    this.svg.call(this.zoom).call(this.zoom.transform, d3.zoomIdentity.translate(offsetX, offsetY));
  }

  componentDidUpdate() {
    this.drawUSMap()
    this.drawFlightGraph()
  }

  render() {
    return (
      <svg
        id="visualization"
        className="visualization"
        ref={(element) => (this.svg = d3.select(element))}
      ></svg>
    );
  }
}

export default USMap;
