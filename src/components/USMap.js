import React from "react";
import * as d3 from "d3";
import us from "../data/us.json";

const projection = d3.geoConicConformal().scale(1600).rotate([109, 5]);
const geoGenerator = d3.geoPath().projection(projection);

class USMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedState: null,
      width: window.innerWidth-5,
      height: window.innerHeight-5,
    };
    this.svg = null
  }

  setSize = () => {
    this.setState({
      width: window.innerWidth-5,
      height: window.innerHeight-5,
    })

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
    for (let i = 0; i < routesElements.length; i++) {
      const route = routesElements[i]
      route.getAttribute("source")
      const A = parseInt(route.getAttribute("source"))
      const B = parseInt(route.getAttribute("target"))
      airportsData[A].size++;
      airportsData[B].size++;
      routesData.push({source: airportsData[A].position, target: airportsData[B].position})
    }

    const g = this.svg.selectChild()

    g.append("g")
      .attr("id", "routes")
      .selectAll("line")
      .data(routesData)
      .enter().append("line")
      .attr("x1", (d) => d.source[0])
      .attr("y1", (d) => d.source[1])
      .attr("x2", (d) => d.target[0])
      .attr("y2", (d) => d.target[1])

    const airports = g
      .append("g")
      .attr("id", "airports")
      .selectAll("circle")
      .data(airportsData)
      .enter().append("circle")
      .attr("r", (d) => Math.sqrt(d.size / Math.PI)*2)
      .attr("cx", (d) => d.position[0])
      .attr("cy", (d) => d.position[1])
    
    airports.append("title").text((d) => d.code);
  }

  componentDidMount() {
    window.addEventListener('resize', this.setSize);

    const g = this.svg.append("g");

    this.zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => {
        const { transform } = event;
        g.attr("transform", transform);
        g.attr("stroke-width", 1 / transform.k);
      });

    const states = g
      .append("g")
      .attr("id", "us-states")
      .selectAll("path")
      .data(us.features.filter(f => f.properties.NAME !== "Alaska" && f.properties.NAME !== "Hawaii" && f.properties.NAME !== "Puerto Rico"))
      .join("path")
      .attr("id", (d) => d.properties.name)
      .attr("d", geoGenerator);

    states.append("title").text((d) => d.properties.name);

    const {x, y, width, height} = document.querySelector('#us-map').getBBox()

    const offsetX = -x + (this.state.width - width)/2;
    const offsetY = -y + (this.state.height - height)/2;

    this.svg.call(this.zoom).call(this.zoom.transform, d3.zoomIdentity.translate(offsetX, offsetY));

    fetch("/airlines.graphml").then(this.parseAirportData);
  }

  render() {
    return (
      <svg
        id="us-map"
        className="us-map"
        width={this.state.width}
        height={this.state.height}
        ref={(element) => (this.svg = d3.select(element))}
      ></svg>
    );
  }
}

export default USMap;
