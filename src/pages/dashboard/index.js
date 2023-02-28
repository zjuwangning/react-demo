import React, {useEffect} from 'react';
import Cache from "../../utils/Cache";
import PubSub from "pubsub-js";

function Dashboard() {
	let websocket = null;

	// componentDidMount componentWillUnmount
	useEffect(() => {
		websocket = window.websocket;
		console.log('websocket', websocket);
	}, []);

	return (
		<div>
			dashboard
		</div>
	);
}

export default Dashboard;
