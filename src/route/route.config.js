import React from 'react';
import {Link} from 'react-router-dom'
import HomePage from "../pages/homepage";
import LoginPage from "../pages/login";
import BasicLayouts from "../layouts/BasicLayouts";
import User from "../pages/user";
import Data from "../pages/data";

const NoMatch = () => (
	<div style={{margin: "50px"}}>
		<h3>404 NOT FOUND</h3>
		<Link to="/">返回主页</Link>
	</div>
)

// 主路由 登录页 首页 后台页面
export const routes = [
	{
		path: '/homepage',
		element: <HomePage/>
	},
	{
		path: '/login',
		element: <LoginPage/>
	},
	{
		path: '/*',
		element: <BasicLayouts/>
	},
	{
		path: '*',
		element: <NoMatch/>
	}
];

// 后台页面路由
export const basicRoutes = [
	{
		path: '/user',
		element: <User/>
	},
	{
		path: '/data',
		element: <Data/>
	},
	{
		path: '*',
		element: <NoMatch/>
	}
];
