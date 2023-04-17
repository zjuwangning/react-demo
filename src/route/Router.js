import React, { useEffect } from 'react';
import {useRoutes} from "react-router-dom";
import { notification } from 'antd'
import {routes} from "./route.config";


function Router() {
	const element = useRoutes(routes);

	// componentDidMount componentWillUnmount
	useEffect(() => {
		notification.config({maxCount: 1, placement: 'top'});
	}, []);

	return (
		<>
			{element}
		</>
	);
}

export default Router;
