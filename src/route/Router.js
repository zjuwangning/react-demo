import React from 'react';
import {useRoutes} from "react-router-dom";
import {routes} from "./route.config";


function Router() {
	const element = useRoutes(routes);
	return (
		<>
			{element}
		</>
	);
}

export default Router;
