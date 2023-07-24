import React from 'react';
import { Navigate, Link } from 'react-router-dom'
import LoginLayouts from "../layouts/LoginLayouts";
import IndexLayouts from "../layouts/IndexLayouts";
import BasicLayouts from "../layouts/BasicLayouts";

import Homepage from "../pages/homepage";
import Character from "../pages/handbook/character";
import Relic from "../pages/handbook/relic";


const NoMatch = () => (
	<div style={{margin: "50px"}}>
		<h3>404 NOT FOUND</h3>
		<Link to="/">返回主页</Link>
	</div>
)

// 主路由
// 包括 登录页 索引页 后台页
export const routes = [
	{path: '/', element: <Navigate to={'/index'}/>},
	{path: '/index', element: <IndexLayouts/>},
	{path: '/login', element: <LoginLayouts/>},
	{path: '/login/*', element: <LoginLayouts/>},
	{path: '/*', element: <BasicLayouts/>}
];

// 后台页面路由
export const basicRoutes = [
	{path: '/homepage', element: <Homepage/>},
	{path: '/handbook/character', element: <Character/>},
	{path: '/handbook/relic', element: <Relic/>},

	{path: '*', element: <NoMatch/>}
];
