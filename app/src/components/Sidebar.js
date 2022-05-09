import { Component } from "react";
import Searchbar from "./Searchbar";

class Sidebar extends Component {
  constructor(props){
    super(props);
		this.state = {airport : null, edges : null, checked : []};
    this.airports = [];
    this.flights = this.props.flights;
    this.checkedID = [];
    this.indexToID = [];
    let dataFile = require('../data/airports.json');
		for (const key in dataFile) {
			if (dataFile[key].iata !== null && dataFile[key].iata !== '' && dataFile[key].iata !== '0') {
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
        let airportGraphObject = this.props.airports.find(el => el.code === airportObject.iata);
        if (airportGraphObject) {
          let id = airportGraphObject.id;
          let connections = this.props.flights.filter(el => el.A === id || el.B === id);
          let cities = [];
          let checked = [];
          this.checkedID = [];
          for (let i = 0; i < connections.length; i++) {
            const element = connections[i];
            let a = 0;
            if(element.A === id) a = element.B;
            else a = element.A;
            let b = this.props.airports.find(el => el.id === a);
            let c = this.airports.find(el => el.iata === b.code);
            if(c && !cities.includes(c.name)) {
              cities.push(c.name);
              checked.push(true);
              this.checkedID.push(a);
              this.indexToID.push(a);
            }
          }
          this.setState({airport : airportObject, edges : cities, checked : checked});
        } else {
          this.setState({airport : airportObject, edges : null});
        }
      }
    } else {
      if(document.title !== "USA airport visualization"){
        document.title = "USA airport visualization";
        this.setState({airport : null, edges : null});
      }
    }
  }

  setChecked(e){
    let id = e.target.getAttribute("index");
    let checked = this.state.checked;
    checked[id] = !this.state.checked[id];
    this.setState({checked : checked});
    if(checked[id]){
      this.checkedID.push(this.indexToID[id]);
    } else {
      this.checkedID = this.checkedID.filter(el => el !== this.indexToID[id]);
    }
    this.props.setChecked(this.checkedID);
  }

  renderInfo(){
    if(this.state.airport === null) return <div className="info"/>;
    return (
    <div className="info">
      <p id="airportName">{this.state.airport.name}</p>
      <p><strong>{"City:"}</strong>{` ${this.state.airport.city}`}</p>
      <p><strong>{"State:"}</strong>{` ${this.state.airport.state}, ${this.state.airport.country}`}</p>
      <p><strong>{"IATA:"}</strong>{` ${this.state.airport.iata}`}</p>
    </div>
    )
  }

  renderScroll(){
    if(this.state.edges === null || this.state.edges === undefined) return <div className="info"/>;
		let arr = [];
		for (let i = 0; i < this.state.edges.length; i++) {

			arr.push(
				<label key={i} className="container">
          {this.state.edges[i]}
          <input index={i} className="checkbox" type="checkbox" checked={this.state.checked[i]} onChange={(e) => this.setChecked(e)}></input>
          <span class="checkmark"></span>
				</label>)
		}
    return (
      <div className="scroll">
        {arr}
      </div>
    )
  }

  render() {
    return <div className="sidebar">
      <Searchbar/>
      {this.renderInfo()}  
      {this.renderScroll()}  
    </div>;
  }
}

export default Sidebar;