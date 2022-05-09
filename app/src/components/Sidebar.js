import { Component } from "react";
import Searchbar from "./Searchbar";

class Sidebar extends Component {
  constructor(props){
    super(props);
		this.state = {airport : null, edges : null};
    this.airports = [];
    let dataFile = require('../data/airports.json');
		for (const key in dataFile) {
			if (dataFile[key].iata != null && dataFile[key].iata != '' && dataFile[key].iata != '0') {
				this.airports.push(dataFile[key]);
			}
		}
  }

  componentDidMount() {
    window.addEventListener('popstate', this.route.bind(this));
    window.addEventListener('hashchange', this.route.bind(this));
    this.route();
	}

  componentWillUnmount(){
    window.removeEventListener('popstate', this.route);
    window.removeEventListener('hashchange', this.route);
  }

  route(e) {
    const url = new URL(window.location.href);
    if(url.hash){
      const airport = url.hash.substring(1).replaceAll('+', ' ');
      if(this.state.airport === null || airport !== this.state.airport.name){
        document.title = airport;
        let airportObject = this.airports.find(el => el.name === airport);
        this.setState({airport : airportObject, edges : null});
      }
    } else {
      document.title = "USA airport visualization";
      this.setState({airport : null, edges : null});
    }
  }

  renderInfo(){
    if(this.state.airport === null) return <div className="info"/>;
    return (
    <div className="info">
      <p id="airportName">{this.state.airport.name}</p>
      <p>{"City: " + this.state.airport.city}</p>
      <p>{`State: ${this.state.airport.state}, ${this.state.airport.country}`}</p>
    </div>
    )
  }

  render() {
    return <div className="sidebar">
      <Searchbar/>
      {this.renderInfo()}  
    </div>;
  }
}

export default Sidebar;