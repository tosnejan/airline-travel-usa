import React, { Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MainContainer from "./containers/MainContainer";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { title: "USA airport visualization", coords: null};
    this.watchID = null;
  }

  setTitle = (title) => {
    document.title = title;
    this.setState({title: title});
  }

  success(pos) {
    this.setState({coords: pos.coords})
  }
  
  error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  componentDidMount(){
    if(this.watchID === null)this.watchID = navigator.geolocation.getCurrentPosition(this.success.bind(this), this.error);
  }

  componentWillUnmount(){
    if(this.watchID !== null) navigator.geolocation.clearWatch(this.watchID);
  }

  render() {
    return (
      <BrowserRouter>
        <Navbar title={this.state.title} coords={this.state.coords}/>
        <Routes>
          <Route path="/airline-travel-usa/" element={<MainContainer setTitle={this.setTitle} coords={this.state.coords}/>} />
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
