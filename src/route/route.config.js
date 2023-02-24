import React from 'react';
import { Navigate, Link } from 'react-router-dom'
import LoginLayouts from "../layouts/LoginLayouts";
import IndexLayouts from "../layouts/IndexLayouts";
import BasicLayouts from "../layouts/BasicLayouts";
import User from "../pages/user";
import Data from "../pages/data";

const NoMatch = () => (
	<div style={{margin: "50px"}}>
		<h3>404 NOT FOUND</h3>
		<Link to="/">返回主页</Link>
	</div>
)

// 主路由
// 包括 登录页 索引页 后台页
export const routes = [
	{
		path: '/',
		element: <Navigate to={'/index'}/>
	},
	{
		path: '/login',
		element: <LoginLayouts/>
	},
	{
		path: '/index',
		element: <IndexLayouts/>
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
