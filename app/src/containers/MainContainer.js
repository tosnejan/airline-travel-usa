import { Component } from "react";
import * as d3 from "d3";
import rawAirportsData from "../data/airports-data.json";
import Sidebar from "../components/Sidebar";
import USMap from "../components/USMap";
import SidebarButton from "../components/SidebarButton";

class MainContainer extends Component {

  constructor(props) {
    super(props)
    this.state = {
      projection: d3.geoConicConformal().scale(1600).rotate([109, 5]),
      airportsData: {
        airports: [],
        maxSize: 0,
      },
      flights: [],
    }
  }
  
  componentDidMount() {
    const { projection } = this.state
    let maxSize = 0;
    const airports = rawAirportsData.nodes.map(n => {
      const size = n.dep + n.arr
      if(size > maxSize){
        maxSize = size;
      }
      return {...n, pos: projection(n.pos), size}
    })
    const flights = rawAirportsData.edges.map(e => {
      const { id, s, t, line } = e;
      return {
        id,
        A: s,
        B: t,
        points: line.map(p => projection(p))
      }
    })
    airports.sort((a,b) =>  (b.size - a.size))
    this.setState({airportsData: {airports, maxSize}, flights})
  }

  render() {
    const { projection, airportsData, flights } = this.state;
    const  {airports, maxSize } = airportsData;
    return (<div className="page">
      <USMap projection={projection} airports={airports} flights={flights} maxSize={maxSize} />
      <div className="sidebarCompact">
        <Sidebar/>
        <SidebarButton/>
      </div>
    </div>);
  }
}

export default MainContainer;
