import React from "react";
import * as d3 from "d3";
import us from "../data/us.json";
import dataFile from "../data/airports.json";

const MAP = "us-states"
const AIRPORTS = "airports"
const FLIGHTS = "flights"
const YOU = "you"

class USMap extends React.Component {
  constructor(props) {
    super(props);
    this.svg = null
    this.state = {
      geoPath: d3.geoPath().projection(props.projection),
      hovered: -1,
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
    const {hovered} = this.state;
    const { airports, flights, selectedFlights, selectedAirport} = this.props;
    const drawFlight = d3.line().curve(d3.curveLinear);

    const flightsSVG = d3.select(`#${FLIGHTS}`)
      .selectAll("path")
      .data(flights)
      .join("path")
      .attr("d", d => drawFlight(d.points))
      .attr('fill', 'none')
      .attr("focused", false)
      .attr("hide", (d) => selectedFlights.length && !selectedFlights.includes(d))
      .filter((d) => {
        if(selectedAirport !== -1 && hovered !== -1) {
          return (d.A === hovered ||  d.B === hovered) && selectedFlights.includes(d)
        } else if (selectedAirport !== -1 ){
          return selectedFlights.includes(d)
        }
        return false
      })
      .attr("focused", true)
      .raise()

    for (let i = 0; i < airports.length; i++) {
      const airport = airports[i]
      airport.routes = flightsSVG.filter(d => d.A === airport.id || d.B === airport.id)
      airport.routesInverse = flightsSVG.filter(d => d.A !== airport.id && d.B !== airport.id)
    }

    d3.select(`#${AIRPORTS}`)
      .selectAll("circle")
      .data(airports)
      .join("circle")
      .attr("r", (d) => Math.sqrt(d.size / Math.PI)*2)
      .attr("cx", (d) => d.pos[0])
      .attr("cy", (d) => d.pos[1])
      .attr("connected", (d) => selectedFlights.some((f) => f.A === d.id || f.B === d.id))
      .attr("focused", (d) => selectedAirport === d.id || hovered === d.id)
      .on("mouseover", (e,d) => {
        d3.select(e.target).attr("focused", true);
        this.setState({hovered: d.id})
      })                  
      .on("mouseout", (e, d) => {
        if(d.id !== selectedAirport) {
          d3.select(e.target).attr("focused", false);
        }
        this.setState({ hovered: -1 })
      }).on("click", (e) => {
        let name = e.target.firstChild.textContent;
        if(window.location.hash === `#${name.replaceAll(' ', '+')}`){
          window.location.hash = 'main';
        } else {
          window.location.hash = name.replaceAll(' ', '+');
        }
      })
      .filter("circle:empty")
      .append("title").text((d) => this.airportsInfo.find(el => el.iata === d.code).name)

    if(this.props.coords){
      let coords = this.props.projection([this.props.coords.longitude, this.props.coords.latitude]);
      d3.select(`#${YOU}`)
        .selectAll("circle")
        .data([coords])
        .join("circle")
        .attr("r", (d) => 5)
        .attr("cx", (d) => d[0])
        .attr("cy", (d) => d[1])
        .filter("circle:empty")
        .append("title").text("Your position");
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
      });
    
    root.append("g").attr("id", MAP).classed("us-map", true);
    const airData = root.append("g").attr("id", "air-travel")
    airData.append("g").attr("id", FLIGHTS).classed("flights", true);
    airData.append("g").attr("id", AIRPORTS).classed("airports", true);
    root.append("g").attr("id", YOU).classed("you", true);

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
