import { Component } from "react";
import Searchbar from "./Searchbar";

class Sidebar extends Component {
  constructor(props){
    super(props);
		this.state = {airport : null, edges : null, checked : []};
    this.airports = [];
    this.flights = this.props.flights;
    this.checkedID = [-1];
    this.indexToID = [];
    this.currentAirportID = -1;
    let dataFile = require('../data/airports.json');
		for (const key in dataFile) {
			if (dataFile[key].iata !== null && dataFile[key].iata !== '' && dataFile[key].iata !== '0') {
				this.airports.push(dataFile[key]);
			}
		}
    this.props.setReferences(this.checkedID, this.currentAirportID);
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

  // componentDidUpdate(){
  //   this.route();
  // }

  routeToMainPage(){
    window.history.replaceState(null, '', window.location.pathname);
    document.title = "USA airport visualization";
    this.checkedID.length = 0;
    this.checkedID.push(-1);
    this.currentAirportID = -1;
    this.setState({airport : null, edges : null});
    this.props.setAirportID(this.currentAirportID);
  }

  route(e) {
    const url = new URL(window.location.href);
    if(url.hash === "#main"){
      this.routeToMainPage();
    } else if(url.hash){
      const airport = url.hash.substring(1).replaceAll('+', ' ');
      if(this.state.airport === null || airport !== this.state.airport.name || this.state.edges === null){
        document.title = airport;
        let airportObject = this.airports.find(el => el.name === airport);
        let airportGraphObject = this.props.airports.find(el => el.code === airportObject.iata);
        if (airportGraphObject) {
          let id = airportGraphObject.id;
          this.currentAirportID = id;
          let connections = this.props.flights.filter(el => el.A === id || el.B === id);
          let cities = [];
          let checked = [];
          this.checkedID.length = 0;
          this.indexToID.length = 0;
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
              this.checkedID.push(element.id);
              this.indexToID.push(element.id);
            }
          }
          this.setState({airport : airportObject, edges : cities, checked : checked});
          this.props.setAirportID(this.currentAirportID);
        } else {
          this.setState({airport : airportObject, edges : null});
        }
      }
    } else {
      if(document.title !== "USA airport visualization"){
        this.routeToMainPage();
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
      const index = this.checkedID.indexOf(this.indexToID[id]);
      if (index > -1) {
        this.checkedID.splice(index, 1);
      }
    }
    this.props.update();
  }

  renderInfo(){
    if(this.state.airport === null) return;
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
    if(this.state.edges === null || this.state.edges === undefined) return (
      <div className="frontPage">
        <p>{"Routes connected to an airport can be highlighted by hovering over it or by searching it."}</p>
        <p>{"You can select the airport by clicking on it or you can use the search bar."}</p>
        <p>{`When you hover over some airport, it will highlight routes that are highlighted at the time and are connected to this airport. 
            This functionality can be used for highlighting routes between two airports by searching the first one and hovering over the second one.`}</p>
        <p>{"When you have some airport selected, you can modify what connections you want to see in this sidebar."}</p>
        <p id="footer">{"Made by Jan Tošner and Jakub Peleška."}</p>
      </div>);
		let arr = [];
		for (let i = 0; i < this.state.edges.length; i++) {
			arr.push(
				<label key={i} className="container">
          {this.state.edges[i]}
          <input index={i} className="checkbox" type="checkbox" checked={this.state.checked[i]} onChange={(e) => this.setChecked(e)}></input>
          <span className="checkmark"></span>
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