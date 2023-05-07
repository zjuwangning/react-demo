import React from 'react';
import { Navigate, Link } from 'react-router-dom'
import LoginLayouts from "../layouts/LoginLayouts";
import IndexLayouts from "../layouts/IndexLayouts";
import RebootLayouts from "../layouts/RebootLayouts";
import BasicLayouts from "../layouts/BasicLayouts";

import Dashboard from "../pages/dashboard";

import Disk from "../pages/storage/disks";
import Initial from "../pages/storage/disks/initialization";
import Pool from "../pages/storage/pool";
import PoolCreate from "../pages/storage/pool/create";
import PoolScrub from "../pages/storage/pool/scrub";
import PoolDetails from "../pages/storage/pool/details";

import Network from "../pages/network";
import GlobalConfig from "../pages/network/global";
import BindNet from "../pages/network/bond";
import NetConfig from "../pages/network/config";

import ShareFiles from "../pages/share/files"
import FileCreate from "../pages/share/files/create"
import FileDetails from "../pages/share/files/details"
import FileEdit from "../pages/share/files/edit"
import NFSAuth from "../pages/share/files/nfs"
import SMBAuth from "../pages/share/files/smb"
import Snapshot from "../pages/share/files/snapshot"
import SnapshotManage from "../pages/share/snapshot"
import SnapshotCreate from "../pages/share/snapshot/create"

import ShareProtocol from "../pages/share/protocol"
import Smb from "../pages/share/protocol/smb"
import Nfs from "../pages/share/protocol/nfs"
import Ftp from "../pages/share/protocol/ftp"
import WebDav from "../pages/share/protocol/webdav"

import SnapshotTask from "../pages/task/snapshot"
import SnapshotTaskCreate from "../pages/task/snapshot/create"
import SnapshotTaskEdit from "../pages/task/snapshot/edit"

import ScrubTask from "../pages/task/scrub"
import ScrubTaskCreate from "../pages/task/scrub/create"
import ScrubTaskEdit from "../pages/task/scrub/edit"

import Rsync from "../pages/task/rsync"

import User from "../pages/credentials/users";
import UserCreate from "../pages/credentials/users/create";
import UserEdit from "../pages/credentials/users/edit";

import Group from "../pages/credentials/groups";
import GroupCreate from "../pages/credentials/groups/create";
import GroupEdit from "../pages/credentials/groups/edit";
import GroupMember from "../pages/credentials/groups/member";

import Logs from "../pages/system/logs";
import Mail from "../pages/system/mail";
import Update from "../pages/system/update";


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
	{path: '/reboot', element: <RebootLayouts/>},
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
	{path: '/storage/pools/details', element: <PoolDetails/>},

	{path: '/network', element: <Network/>},
	{path: '/network/global-config', element: <GlobalConfig/>},
	{path: '/network/bond', element: <BindNet/>},
	{path: '/network/config', element: <NetConfig/>},

	{path: '/share/files', element: <ShareFiles/>},
	{path: '/share/files/create', element: <FileCreate/>},
	{path: '/share/files/details', element: <FileDetails/>},
	{path: '/share/files/edit', element: <FileEdit/>},
	{path: '/share/files/nfs-auth', element: <NFSAuth/>},
	{path: '/share/files/smb-auth', element: <SMBAuth/>},
	{path: '/share/files/snapshot', element: <Snapshot/>},

	{path: '/share/protocol', element: <ShareProtocol/>},
	{path: '/share/protocol/smb', element: <Smb/>},
	{path: '/share/protocol/ftp', element: <Ftp/>},
	{path: '/share/protocol/nfs', element: <Nfs/>},
	{path: '/share/protocol/webdav', element: <WebDav/>},

	{path: '/share/snapshot-manage', element: <SnapshotManage/>},
	{path: '/share/snapshot-manage/create', element: <SnapshotCreate/>},


	{path: '/task/snapshot-task', element: <SnapshotTask/>},
	{path: '/task/snapshot-task/create', element: <SnapshotTaskCreate/>},
	{path: '/task/snapshot-task/edit', element: <SnapshotTaskEdit/>},

	{path: '/task/scrub-task', element: <ScrubTask/>},
	{path: '/task/scrub-task/create', element: <ScrubTaskCreate/>},
	{path: '/task/scrub-task/edit', element: <ScrubTaskEdit/>},

	{path: '/task/rsync-task', element: <Rsync/>},

	{path: '/credentials/users', element: <User/>},
	{path: '/credentials/users/create', element: <UserCreate/>},
	{path: '/credentials/users/edit', element: <UserEdit/>},

	{path: '/credentials/groups', element: <Group/>},
	{path: '/credentials/groups/create', element: <GroupCreate/>},
	{path: '/credentials/groups/edit', element: <GroupEdit/>},
	{path: '/credentials/groups/member', element: <GroupMember/>},

	{path: '/system/logs', element: <Logs/>},
	{path: '/system/mailservice', element: <Mail/>},
	{path: '/system/update', element: <Update/>},

	{path: '*', element: <NoMatch/>}
];
