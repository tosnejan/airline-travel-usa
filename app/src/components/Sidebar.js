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
    this.currentAirportID = -1;
    let dataFile = require('../data/airports.json');
		for (const key in dataFile) {
			if (dataFile[key].iata !== null && dataFile[key].iata !== '' && dataFile[key].iata !== '0') {
				this.airports.push(dataFile[key]);
			}
		}
    this.props.setReferences(this.checkedID, this.currentAirportID);
    this.lastHash = undefined;
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

  componentDidUpdate(){
    this.route();
  }

  routeToMainPage(){
    window.history.replaceState(null, '', window.location.pathname);
    this.props.setTitle("USA airport visualization");
    this.checkedID.length = 0;
    this.currentAirportID = -1;
    this.setState({airport : null, edges : null});
    this.props.setAirportID(this.currentAirportID);
  }

  route(e) {
    const url = new URL(window.location.href);
    this.lastHash = url.hash;
    if(url.hash === "#main"){
      this.routeToMainPage();
    } else if(url.hash){
      const airport = url.hash.substring(1).replaceAll('+', ' ');
      if(this.state.airport === null || airport !== this.state.airport.name || this.state.edges === null){
        this.props.setTitle(airport);
        let airportObject = this.airports.find(el => el.name === airport);
        let airportGraphObject = this.props.airports.find(el => el.code === airportObject.iata);
        if (airportGraphObject) {
          let id = airportGraphObject.id;
          this.currentAirportID = id;
          let connections = this.props.flights.filter(el => el.A === id || el.B === id);
          let cities = [];
          let checked = [];
          this.checkedID.splice(0, this.checkedID.length);
          this.indexToID.splice(0, this.indexToID.length);
          let stored = localStorage.getItem(airportObject.iata);
          if(stored !== null){
            stored = JSON.parse(stored);
          }
          let j = 0;
          for (let i = 0; i < connections.length; i++) {
            const element = connections[i];
            let a = 0;
            if(element.A === id) a = element.B;
            else a = element.A;
            let b = this.props.airports.find(el => el.id === a);
            let c = this.airports.find(el => el.iata === b.code);
            if(c && !cities.includes(c.name)) {
              cities.push(c.name);
              if(stored) checked.push(stored[j]);
              else checked.push(true);
              if (checked[j]) this.checkedID.push(element);
              this.indexToID.push(element);
              j++;
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
    localStorage.setItem(this.state.airport.iata, JSON.stringify(checked));
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

  changeAll(val){
    console.log(val);
    let checked = this.state.checked;
    this.checkedID.length = 0;
		for (let i = 0; i < this.state.checked.length; i++) {
      checked[i] = val;
      if(val) this.checkedID.push(this.indexToID[i]);
    }
    localStorage.setItem(this.state.airport.iata, JSON.stringify(checked));
    this.setState({checked : checked});
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

  renderToggle(){
    if(this.state.edges === null || this.state.edges === undefined) return;
    const unchecked = this.state.checked.filter(e => !e);
    let checked = false;
    if(unchecked.length === 0) {
      checked = true;
      localStorage.removeItem(this.state.airport.iata);
    }
    return (<div className="toggle">
              <label className="container">
                {"Toggle all"}
                <input className="checkbox" type="checkbox" checked={checked} onChange={(e) => this.changeAll(e.target.checked)}></input>
                <span className="checkmark all"></span>
              </label> 
            </div>)
  }

  renderScroll(){
    if(this.state.edges === null || this.state.edges === undefined) return (
      <div className="frontPage">
        <p>{"Routes connected to airport can be highlighted by selecting it. You can select the airport by clicking on it or you can use the search bar."}</p>
        <p>{`When you hover over some airport, it will highlight routes that are highlighted at the time and are connected to this airport. 
            This functionality can be used for highlighting routes between two airports by searching the first one and hovering over the second one.`}</p>
        <p>{"When you have some airport selected, you can modify what connections you want to see in this sidebar."}</p>
        <p>{"The airport can be unselected by clicking on it again or by clicking on an airplane in top left corner."}</p>
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
      <Searchbar airports={this.props.airports}/>
      {this.renderInfo()} 
      {this.renderToggle()}
      {this.renderScroll()}  
    </div>;
  }
}

export default Sidebar;