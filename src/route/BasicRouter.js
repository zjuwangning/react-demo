import React from 'react';
import { useRoutes } from "react-router-dom";
import { basicRoutes } from "./route.config";


function BasicRouter() {
	const element = useRoutes(basicRoutes);
	return (
		<>
			{element}
		</>
	);
}

export default BasicRouter;
