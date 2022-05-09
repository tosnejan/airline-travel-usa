import { Component } from "react";

class Navbar extends Component {
  componentDidMount() {
    window.addEventListener('popstate', e => {
      this.forceUpdate();
    });
    window.addEventListener('hashchange', e => {
      this.forceUpdate();
    });
    let img = document.getElementById("airplane");
    img.addEventListener('click', e => {
      window.location.hash = '';
      window.history.replaceState(null,  '', window.location.pathname);
    });
	}

  render() {
    return <div className="navbar">
      <div id="airplaneDiv">
        <img id="airplane" src="https://cdn-icons-png.flaticon.com/512/31/31069.png" alt="airplane"/>
      </div>
      <p id="navbarTitle">{document.title}</p>
    </div>;
  }
}

export default Navbar;