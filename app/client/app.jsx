import React from 'react'
import {Route, Switch, withRouter} from "react-router";
import {setInitialData} from "./helpers/initialData";
import isNode from 'detect-node';
import Index from "./routes/index";

class App extends React.Component {
	constructor({initialData}) {
		super();

		if(isNode){
            setInitialData(initialData);
        } else {
            setInitialData(JSON.parse(document.getElementById('initialData').textContent));
        }
	}

	componentDidMount() {
	    this.unlisten = this.props.history.listen(() => {
            setInitialData(null);
        });
	}

	componentWillUnmount() {
        this.unlisten();
	}
	
	render() {
		return (
			<Switch>
                <Route path="/" exact component={Index}/>
			</Switch>
		)
	}
}

export default withRouter(App);
