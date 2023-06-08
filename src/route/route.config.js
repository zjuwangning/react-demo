import React from 'react';
import { Navigate, Link } from 'react-router-dom'
import LoginLayouts from "../layouts/LoginLayouts";
import LicenseLayouts from "../layouts/LicenseLayouts";
import IndexLayouts from "../layouts/IndexLayouts";
import BasicLayouts from "../layouts/BasicLayouts";
import RebootLayouts from "../layouts/RebootLayouts";
import ShutdownLayouts from "../layouts/ShutdownLayouts";

import Dashboard from "../pages/dashboard";

import User from "../pages/credentials/users";
import UserCreate from "../pages/credentials/users/create";
import UserEdit from "../pages/credentials/users/edit";

import Group from "../pages/credentials/groups";
import GroupCreate from "../pages/credentials/groups/create";
import GroupEdit from "../pages/credentials/groups/edit";
import GroupMember from "../pages/credentials/groups/member";


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
	{path: '/license', element: <LicenseLayouts/>},
	{path: '/login', element: <LoginLayouts/>},
	{path: '/login/*', element: <LoginLayouts/>},
	{path: '/reboot', element: <RebootLayouts/>},
	{path: '/shutdown', element: <ShutdownLayouts/>},
	{path: '/*', element: <BasicLayouts/>}
];

// 后台页面路由
export const basicRoutes = [
	{path: '/dashboard', element: <Dashboard/>},

	{path: '/credentials/users', element: <User/>},
	{path: '/credentials/users/create', element: <UserCreate/>},
	{path: '/credentials/users/edit', element: <UserEdit/>},

	{path: '/credentials/groups', element: <Group/>},
	{path: '/credentials/groups/create', element: <GroupCreate/>},
	{path: '/credentials/groups/edit', element: <GroupEdit/>},
	{path: '/credentials/groups/member', element: <GroupMember/>},

	{path: '*', element: <NoMatch/>}
];
