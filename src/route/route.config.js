import React from 'react';
import { Navigate, Link } from 'react-router-dom'
import LoginLayouts from "../layouts/LoginLayouts";
import IndexLayouts from "../layouts/IndexLayouts";
import BasicLayouts from "../layouts/BasicLayouts";

import Dashboard from "../pages/dashboard";
import Disk from "../pages/storage/disks";
import Initial from "../pages/storage/disks/initialization";

import Pool from "../pages/storage/pool";
import PoolCreate from "../pages/storage/pool/create";
import PoolScrub from "../pages/storage/pool/scrub";

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
	{path: '/login', element: <LoginLayouts/>},
	{path: '/index', element: <IndexLayouts/>},
	{path: '/*', element: <BasicLayouts/>}
];

// 后台页面路由
export const basicRoutes = [
	{path: '/dashboard', element: <Dashboard/>},
	{path: '/storage/disks', element: <Disk/>},
	{path: '/storage/disks/initialization', element: <Initial/>},
	{path: '/storage/pools', element: <Pool/>},
	{path: '/storage/pools/create', element: <PoolCreate/>},
	{path: '/storage/pools/scrub', element: <PoolScrub/>},
	{path: '/credentials/users', element: <User/>},
	{path: '/credentials/users/create', element: <UserCreate/>},
	{path: '/credentials/users/edit', element: <UserEdit/>},
	{path: '/credentials/groups', element: <Group/>},
	{path: '/credentials/groups/create', element: <GroupCreate/>},
	{path: '/credentials/groups/edit', element: <GroupEdit/>},
	{path: '/credentials/groups/member', element: <GroupMember/>},
	{path: '*', element: <NoMatch/>}
];
