import React from "react";
import * as d3 from "d3";
import * as topojson from "topojson";
import us from "../static/us.json";

const path = d3.geoPath();

class USMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: props.width || 975,
      height: props.height || 610,
      svg: null,
    };
  }

  componentDidMount() {
    const g = this.svg.append("g");

    const states = g
      .append("g")
      .attr("fill", "#444")
      .attr("cursor", "pointer")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .join("path")
      .attr("d", path);

    states.append("title").text((d) => d.properties.name);

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
  }

  render() {
    const { width, height } = this.state;
    return (
      <svg
        width={width}
        height={height}
        ref={(element) => (this.svg = d3.select(element))}
      ></svg>
    );
  }
}

export default USMap;
