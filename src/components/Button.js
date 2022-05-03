import { Component } from "react";

class MyButton extends Component {
	constructor(props){
		super(props);
		this.state = {color: "red"}
	}

	render() {
		return <button color={this.state.color}>{this.props.text}</button>;
	}
}

export default MyButton;
