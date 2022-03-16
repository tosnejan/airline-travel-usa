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
      selectedState: null,
    };
  }

  componentDidMount() {
    const { width, height } = this.state;
    const g = this.svg.append("g");

    this.zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        const { transform } = event;
        g.attr("transform", transform);
        g.attr("stroke-width", 1 / transform.k);
      });

    const states = g
      .append("g")
      .attr("id", "us-states")
      .attr("fill", "#444")
      .attr("cursor", "pointer")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .join("path")
      .on("click", (e, d) => {
        const {selectedState} = this.state
        
        e.stopPropagation();

        if(selectedState === d.properties.name){
          return this.reset()
        } else 
          d3.select(`#${selectedState}`).transition().style("fill", null);

        this.setState({selectedState: d.properties.name})
        
        d3.select(e.target).transition().style("fill", "red");

        const [[x0, y0], [x1, y1]] = path.bounds(d);
        this.svg
          .transition()
          .duration(750)
          .call(
            this.zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(
                Math.min(
                  2,
                  0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)
                )
              )
              .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(e, this.svg.node())
          );
      })
      .attr("id", (d) => d.properties.name)
      .attr("d", path);

    states.append("title").text((d) => d.properties.name);

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

    this.svg.call(this.zoom);
  }

  reset = () => {
    const { width, height, selectedState } = this.state;
    d3.select(`#${selectedState}`).transition().style("fill", null);
    this.setState({selectedState: null})
    this.svg
      .transition()
      .duration(750)
      .call(
        this.zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(this.svg.node()).invert([width / 2, height / 2])
      );
  };

  render() {
    const { width, height } = this.state;
    return (
      <svg
        width={width}
        height={height}
        ref={(element) => (this.svg = d3.select(element))}
        onClick={this.reset}
      ></svg>
    );
  }
}

export default USMap;
