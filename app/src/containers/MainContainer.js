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
      projection: d3.geoProjection(this.getConformalConicProjection(1, 33, 45, 39.8, -98.6)).scale(1600).rotate([0,5]),
      airportsData: {
        airports: [],
        maxSize: 0,
      },
      flights: [],
      selectedAirport: -1,
      title: "USA airport visualization",
    }
  }

  getConformalConicProjection(R, sp1, sp2, ref_lat, ref_lon) {
    const { PI, log, pow, tan, cos, sin} = Math;
    const PI_4 = PI / 4;
    const radians = PI / 180.0;
    sp1 = sp1 * radians;
    sp2 = sp2 * radians;
    ref_lat = ref_lat * radians;
    ref_lon = ref_lon * radians;
    const n = sp1 !== sp2 ? log(cos(sp1) / cos(sp2)) / log(tan(PI_4 + 0.5*sp2) / tan(PI_4 + 0.5*sp1)) : sin(sp1);
    const F = (cos(sp1) * pow(tan(PI_4 + 0.5*sp1), n)) / n;
    const ro_ref = (R*F) / pow(tan(PI_4 + 0.5*ref_lat), n);
    const projection = (lon, lat) => {
      const ro = (R*F) / pow(tan(PI_4 + 0.5*lat), n);
      const theta = n*(lon-ref_lon);
      const x = ro*sin(theta);
      const y = ro_ref - ro*cos(theta);
      return [x, y];
    };
    return projection;
  }
  
  componentDidMount() {
    const { projection } = this.state;
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

  setReferences = (arr, id) => {
    this.setState({ selectedFlights : arr, selectedAirport : id });
  }

  setAirportID = (id) => {
    this.setState({selectedAirport : id});
  }

  setTitle = (title) => {
    this.props.setTitle(title);
  }

  customForceUpdate = () => {
    this.forceUpdate();
  }

  render() {
    const { projection, airportsData, flights, selectedFlights, selectedAirport, title } = this.state;
    const  {airports } = airportsData;
    return (<div className="page">
      <USMap 
        projection={projection} 
        airports={airports} 
        flights={flights} 
        selectedFlights={selectedFlights} 
        selectedAirport={selectedAirport}
      />
      <div className="sidebarCompact">
        <Sidebar 
          airports={airports} 
          flights={flights} 
          setReferences={this.setReferences} 
          setAirportID={this.setAirportID} 
          update={this.customForceUpdate}
          setTitle={this.setTitle}
        />
        <SidebarButton/>
      </div>
    </div>);
  }
}

export default MainContainer;
