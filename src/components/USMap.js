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
      airportsData.push({ position: projection([x,y],), code, size: 0 })
    }
    let maxSize = 0
    for (let i = 0; i < routesElements.length; i++) {
      const route = routesElements[i]
      route.getAttribute("source")
      const A = parseInt(route.getAttribute("source"))
      const B = parseInt(route.getAttribute("target"))
      airportsData[A].size++;
      airportsData[B].size++;
      routesData.push({source: airportsData[A].position, target: airportsData[B].position})
      maxSize = Math.max(A, B, maxSize)
    }

    const root = this.svg.selectChild()

    root.append("g")
      .attr("id", "routes")
      .selectAll("line")
      .data(routesData)
      .join("line")
      .attr("stroke", (d) => {
        const dir = difference(d.target, d.source)
        const i = (1 + dot(dir , [1, 0])/size(dir))/2
        return d3.interpolateRainbow(i)
      })
      .attr("x1", (d) => d.source[0])
      .attr("y1", (d) => d.source[1])
      .attr("x2", (d) => d.target[0])
      .attr("y2", (d) => d.target[1])
      

    const airports = root
      .append("g")
      .attr("id", "airports")
      .selectAll("circle")
      .data(airportsData)
      .join("circle")
      .attr("r", (d) => Math.sqrt(d.size / Math.PI)*2)
      .attr("fill", (d) => d3.interpolateViridis((d.size - 1) / maxSize))
      .attr("cx", (d) => d.position[0])
      .attr("cy", (d) => d.position[1])
    
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
