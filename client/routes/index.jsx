import React from 'react'
import {fetchInitialData, getInitialData} from "../helpers/initialData";

const busyBraile = ['⠙', '⠸', '⢰', '⣠', '⣄', '⡆', '⠇', '⠋'];

export default class Index extends React.Component {
	constructor() {
		super();
		
		this.state = {
			...getInitialData(),
			counter: 0,
		};
	}
	
	async componentDidMount() {
		this.setState({
			...(await fetchInitialData()),
		});
		this.interval = setInterval(() => {
			this.setState({counter: (this.state.counter + 1) % busyBraile.length})
		}, 100);
	}
	
	componentWillUnmount() {
		clearInterval(this.interval);
	}
	
	render() {
		return (
			<div className="indexPage">
				{busyBraile[this.state.counter]}
				{this.state.kek}
				{busyBraile[this.state.counter]}
			</div>
		)
	}
}
