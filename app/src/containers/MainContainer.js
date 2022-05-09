import { Component } from "react";
import Sidebar from "../components/Sidebar";
import USMap from "../components/USMap";
import SidebarButton from "../components/SidebarButton";

class MainContainer extends Component {
  render() {
    return (<div className="page">
      <USMap />
      <div className="sidebarCompact">
        <Sidebar/>
        <SidebarButton/>
      </div>
    </div>);
  }
}

export default MainContainer;
