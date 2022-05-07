import { Component } from "react";
import Searchbar from "./Searchbar";

class Sidebar extends Component {
  render() {
    return <div className="sidebar">
      <Searchbar/>
    </div>;
  }
}

export default Sidebar;