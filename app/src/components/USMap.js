import React from "react";
import * as d3 from "d3";
import us from "../data/us.json";
import { difference, dot, size } from "../utils";

const projection = d3.geoConicConformal().scale(1600).rotate([109, 5]);
const geoGenerator = d3.geoPath().projection(projection);

class USMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedState: null,
    };
    this.svg = null
  }

  parseAirportData = async (data) => {
    const airtravel = await data.text()
    const parser = new DOMParser();
    const airtravelDoc = parser.parseFromString(airtravel, "text/xml")
    
    const airportsData = []
    const routesData = []

    const airportsElements = airtravelDoc.getElementsByTagName("node")
    const routesElements= airtravelDoc.getElementsByTagName("edge")
    
    for (let i = 0; i < airportsElements.length; i++) {
      const airport = airportsElements[i]
      const x = parseFloat(airport.querySelector('[key="x"]').innerHTML)*0.1
      const y = parseFloat(airport.querySelector('[key="y"]').innerHTML)*(-0.1)
      const code = airport.querySelector('[key="tooltip"]').innerHTML.substring(0,3)
      airportsData.push({ position: projection([x,y],), code, size: 0, index: i })
    }
    let maxSize = 0
    for (let i = 0; i < routesElements.length; i++) {
      const route = routesElements[i]
      route.getAttribute("source")
      const A = parseInt(route.getAttribute("source"))
      const B = parseInt(route.getAttribute("target"))
      airportsData[A].size++;
      airportsData[B].size++;
      routesData.push({source: A, target: B, sourcePostion: airportsData[A].position, targetPostion: airportsData[B].position})
      maxSize = Math.max(A, B, maxSize)
    }

    airportsData.sort((a,b) =>  b.size - a.size)

    const root = this.svg.selectChild()

    const routes = root.append("g")
      .attr("id", "routes")
      .selectAll("line")
      .data(routesData)
      .join("line")
      .style("stroke", (d) => {
        const dir = difference(d.targetPostion, d.sourcePostion)
        const i = (1 + dot(dir , [1, 0])/size(dir))/2
        d.color = d3.interpolateRainbow(i)
        return d.color
      })
      .attr("x1", (d) => d.sourcePostion[0])
      .attr("y1", (d) => d.sourcePostion[1])
      .attr("x2", (d) => d.targetPostion[0])
      .attr("y2", (d) => d.targetPostion[1])
      .on("load", function(e, d) {
        console.log(d3.select(this))
        airportsData[d.source].routes.merge(d3.select(this))
        airportsData[d.target].routes.merge(d3.select(this))
      })

    for (let i = 0; i < airportsData.length; i++) {
      const airport = airportsData[i]
      airport.routes = routes.filter(d => d.source === airport.index || d.target === airport.index)
      airport.routesInverse = routes.filter(d => d.source !== airport.index && d.target !== airport.index)
    }

    const airports = root
      .append("g")
      .attr("id", "airports")
      .selectAll("circle")
      .data(airportsData)
      .join("circle")
      .attr("r", (d) => Math.sqrt(d.size / Math.PI)*2)
      .attr("cx", (d) => d.position[0])
      .attr("cy", (d) => d.position[1])
      .style("fill", (d) => { 
        d.color = d3.interpolateViridis((d.size - 1) / maxSize)
        return d.color
      })
      .on("mouseover", function(e,d) {
        d3.select(this).style("fill", "red");
        d.routes.style("stroke", "red")
        d.routesInverse.style("opacity", 0.1)
      })                  
      .on("mouseout", function(e, d) {
        d3.select(this).style("fill", d.color);
        d.routes.style("stroke", (l) => l.color)
        d.routesInverse.style("opacity", 1)
      });
    
    airports.append("title").text((d) => d.code);
  }

  componentDidMount() {
    window.addEventListener('resize', this.setSize);

    const root = this.svg.append("g");

    this.zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => {
        const { transform } = event;
        root.attr("transform", transform);
        root.attr("stroke-width", 1 / transform.k);
      });

    const states = root
      .append("g")
      .attr("id", "us-states")
      .selectAll("path")
      .data(us.features.filter(f => f.properties.NAME !== "Alaska" && f.properties.NAME !== "Hawaii" && f.properties.NAME !== "Puerto Rico"))
      .join("path")
      .attr("id", (d) => d.properties.name)
      .attr("d", geoGenerator);

    states.append("title").text((d) => d.properties.name);
    
    const map = document.querySelector('#us-map')
    const {x, y, width: wBB, height: hBB } = map.getBBox()
    const {width, height} = getComputedStyle(map)

    const offsetX = -x + (parseInt(width.replace('px', '')) - wBB)/2;
    const offsetY = -y + (parseInt(height.replace('px', ''))  - hBB)/2;

    this.svg.call(this.zoom).call(this.zoom.transform, d3.zoomIdentity.translate(offsetX, offsetY));

    fetch("/airlines.graphml").then(this.parseAirportData);
  }

  render() {
    return (
      <svg
        id="us-map"
        className="us-map"
        ref={(element) => (this.svg = d3.select(element))}
      ></svg>
    );
  }
}

export default USMap;
