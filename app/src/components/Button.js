import { Component } from "react";

class MyButton extends Component {
	constructor(props){
		super(props);
		this.state = {color: "red"}
	}
	componentDidMount() {
		document.querySelector('#downloadButton')
		.addEventListener("click", e => {
			const map = document.querySelector('#visualization');
			var serializer = new XMLSerializer();
			var source = serializer.serializeToString(map);
			if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
				source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
			}
			if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
				source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
			}
			//add xml declaration
			source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

			//convert svg source to URI data scheme.
			var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
		
			//set url value to a element's href attribute.
			// document.getElementById(linkId).href = url;

			var link = document.createElement("a");
			// If you don't know the name or want to use
			// the webserver default set name = ''
			link.setAttribute('download', "us_map.svg");
			link.href = url;
			document.body.appendChild(link);
			link.click();
			link.remove();
		});
	}

	render() {
		return <div id="buttonDiv">
			<button id="downloadButton" color={this.state.color}>{this.props.text}</button>
		</div>;
	}
}

export default MyButton;
