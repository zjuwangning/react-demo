import React from 'react';
import {Link, Navigate} from 'react-router-dom'
import HomePage from "../pages/homepage";

const NoMatch = () => (
	<div style={{margin: "50px"}}>
		<h3>404 NOT FOUND</h3>
		<Link to="/">返回主页</Link>
	</div>
)

const routes = [
	{
		path: '/',
		element: <Navigate to={'/index'}/>
	},
	{
		path: '/index',
		element: <HomePage/>
	},
	{
		path: '*',
		element: <NoMatch/>
	}
];

export default routes;
