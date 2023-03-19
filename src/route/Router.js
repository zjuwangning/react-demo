import React, { useEffect } from 'react';
import {useRoutes} from "react-router-dom";
import {routes} from "./route.config";


function Router() {
	const element = useRoutes(routes);

	// componentDidMount componentWillUnmount
	useEffect(() => {

	}, []);

	return (
		<>
			{element}
		</>
	);
}

export default Router;
