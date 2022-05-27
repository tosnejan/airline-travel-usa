import { Component } from "react";

class Searchbar extends Component {
	constructor(props){
		super(props);
		this.state = {inputValue : "", active : false}
		this.airports = []
		this.airportNames = []
		this.changed = false;
	}

	parseAirportData(data){
		let dataFile = require('../data/airports.json');

		let iatas = {};

		for (const key in dataFile) {
			if (dataFile[key].iata !== null && dataFile[key].iata !== '' && dataFile[key].iata !== '0') {
				iatas[dataFile[key].iata] = dataFile[key];
				this.airports.push(dataFile[key]);
			}
		}

		for (let i = 0; i < data.length; i++) {
		  const airport = data[i]
		  if(iatas[airport.code] !== null){
			  this.airportNames.push(iatas[airport.code].name)
		  }
		}
	}

	componentDidMount() {
		this.inp = document.getElementById("myInput");
		this.autocomplete(this.inp);
	}

	autocomplete(inp) {
		/*the autocomplete function takes two arguments,
		the text field element and an array of possible autocompleted values:*/
		var currentFocus;

		const searchbarReference = this;
		/*execute a function when someone writes in the text field:*/
		inp.addEventListener("focus", function(e) {
			searchbarReference.setState({inputValue: this.value, active: true})
		});
		inp.addEventListener("input", function(e) {
			currentFocus = -1;
			searchbarReference.setState({inputValue: this.value, active: true})
		});
		/*execute a function presses a key on the keyboard:*/
		inp.addEventListener("keydown", function(e) {
			let x = document.getElementsByClassName("autocomplete-item");
			if (e.keyCode === 40) {
			  /*If the arrow DOWN key is pressed,
			  increase the currentFocus variable:*/
			  currentFocus++;
			  /*and and make the current item more visible:*/
			  addActive(x);
			} else if (e.keyCode === 38) { //up
			  /*If the arrow UP key is pressed,
			  decrease the currentFocus variable:*/
			  currentFocus--;
			  /*and and make the current item more visible:*/
			  addActive(x);
			} else if (e.keyCode === 13) {
			  /*If the ENTER key is pressed, prevent the form from being submitted,*/
			  e.preventDefault();
			  if (currentFocus > -1) {
				/*and simulate a click on the "active" item:*/
				if (x) x[currentFocus].click();
			  }
			}
		});
		function addActive(x) {
		  /*a function to classify an item as "active":*/
		  if (!x) return false;
		  /*start by removing the "active" class on all items:*/
		  removeActive(x);
		  if (currentFocus >= x.length) currentFocus = 0;
		  if (currentFocus < 0) currentFocus = (x.length - 1);
		  /*add class "autocomplete-active":*/
		  x[currentFocus].classList.add("autocomplete-active");
		}
		function removeActive(x) {
		  /*a function to remove the "active" class from all autocomplete items:*/
		  for (var i = 0; i < x.length; i++) {
			x[i].classList.remove("autocomplete-active");
		  }
		}
		/*execute a function when someone clicks in the document:*/
		document.addEventListener("click", function (e) {
			if (e.target !== inp) {
				inp.value = "";
				searchbarReference.setState({active: false})
			}
		});
	}

	componentDidUpdate(){
		if(this.airportNames.length === 0 && this.props.airports) this.parseAirportData(this.props.airports);
		if(this.changed){
			this.changed = false;
			let items = document.getElementsByClassName("autocomplete-item");
			for (const d of items) {
				d.addEventListener("click", (e) => {
					/*insert the value for the autocomplete text field:*/
					const val = d.getElementsByTagName("input")[0].value;
					this.setState({inputValue: val, active: false});
					window.location.hash = val.replaceAll(' ', '+');
					this.inp.value = val;
				});
			}
		}
	}

	renderDivs(){
		let val = this.state.inputValue;
		let active = this.state.active;
		this.changed = true;
		if(val === "" || !active) return;
		let found = this.airportNames.filter(el => el.substr(0, val.length).toUpperCase() === val.toUpperCase());
		if(found.length === 0) return;
		let arr = [];
		for (let i = 0; i < found.length; i++) {
			arr.push(
				<div key={i} className="autocomplete-item">
					<strong>{found[i].substr(0, val.length)}</strong>
					{found[i].substr(val.length)}
					<input type="hidden" value={found[i]}></input>
				</div>)
		}
		return <div id="myInputautocomplete-list" className="autocomplete-items">
				{arr}
			</div>;
	}

	render() {
		return <form className="searchBar" autoComplete="off" action="/action_page.php">
			<div className="autocomplete">
				<input id="myInput" type="text" name="myAirport" placeholder="Airport"/>
				{this.renderDivs()}
			</div>
		</form>;
	}
}

export default Searchbar;