import React, { Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainContainer from "./containers/MainContainer";

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainContainer />} />
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
