import React, { Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MainContainer from "./containers/MainContainer";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { title: "USA airport visualization" };
  }

  setTitle = (title) => {
    document.title = title;
    this.setState({title: title});
  }

  render() {
    return (
      <BrowserRouter>
        <Navbar title={this.state.title}/>
        <Routes>
          <Route path="/" element={<MainContainer setTitle={this.setTitle}/>} />
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
