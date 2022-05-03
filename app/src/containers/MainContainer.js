import { Component } from "react";
import Sidebar from "../components/Sidebar";
import USMap from "../components/USMap";

class MainContainer extends Component {
  render() {
    return (<div className="page">
      <Sidebar />
      <USMap />
    </div>);
  }
}

export default MainContainer;
