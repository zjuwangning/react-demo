import React, { useEffect } from 'react';
import {useRoutes} from "react-router-dom";
import {routes} from "./route.config";
import WebSocketService from '../server/index'


function Router() {
	const element = useRoutes(routes);
	console.log('get in Router');

	// componentDidMount componentWillUnmount
	useEffect(() => {
		window.websocket = new WebSocketService();
	}, []);

	return (
		<>
			{element}
		</>
	);
}

export default Router;
