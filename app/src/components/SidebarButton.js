import { Component } from "react";

class SidebarButton extends Component {
  constructor(props){
		super(props);
		this.visible = true;
		this.arrow = "<";
    document.body.classList.add('menu-visible');
  }

  componentDidMount() {
    const button = document.getElementById("sidebarButton");
    button.addEventListener("click", e => {
      this.visible = !this.visible;
      if(this.visible) {
        this.arrow = "<";
      } else {
        this.arrow = ">";
      }
      this.forceUpdate();
      if (this.visible) {
        document.body.classList.remove('menu-hidden');
      } else {
        document.body.classList.add('menu-hidden');
      }
    })   
	}

  render() {
    return <div id="sidebarButton">
      <p id="arrow">{this.arrow}</p>
    </div>
  }
}

export default SidebarButton;