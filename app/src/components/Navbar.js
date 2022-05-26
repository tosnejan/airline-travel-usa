import { Component } from "react";

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = { locationText: "getting location" };
  }
  componentDidMount() {
    window.addEventListener('popstate', e => {
      this.forceUpdate();
    });
    window.addEventListener('hashchange', e => {
      this.forceUpdate();
    });
    let img = document.getElementById("airplane");
    img.addEventListener('click', e => {
      window.location.hash = 'main';
    });
	}  

  render() {
    let locationText = "getting location";
    if (this.props.coords !== null){
      locationText = `Coordinations: ${this.props.coords.latitude} ${this.props.coords.longitude}`;
      // locationText = `Latitude : ${this.props.coords.latitude} Longitude: ${this.props.coords.longitude}`;
    }
    return <div className="navbar">
      <div id="airplaneDiv">
        <img id="airplane" src="https://cdn-icons-png.flaticon.com/512/31/31069.png" alt="airplane"/>
      </div>
      <p id="location">{locationText}</p>
      <p id="navbarTitle">{this.props.title}</p>
    </div>;
  }
}

export default Navbar;