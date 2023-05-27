import React, { useEffect, useState } from 'react';
import { DashboardOutlined, UploadOutlined, ShareAltOutlined, UserOutlined, SettingOutlined, SnippetsOutlined, ApartmentOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom'
import PubSub from "pubsub-js";
import { SubEvent } from '../enum'
import '../index.css'

const rootSubmenuKeys = ['/storage', '/share', '/task', '/credentials', '/system'];

const MenuList = () => {
	const [openKeys, setOpenKeys] = useState(['']);
	const [selectedKeys, setSelectedKeys] = useState(['']);
	const navigate = useNavigate();
	const location = useLocation();
	let menuSub = null;

	// componentDidMount
	useEffect(() => {
		setSelectedKeys([location.pathname]);
		// 监听其他页面发布的跳转事件
		menuSub = PubSub.subscribe(SubEvent.SWITCH_PAGE, (_, url)=>{
			navigate(url)
			setSelectedKeys([url])
			let openKey = '/'+url.split('/')[1]
			if (rootSubmenuKeys.includes(openKey)) {
				setOpenKeys([openKey])
			}
		})
		// 监听浏览器前进后退事件
		window.addEventListener('popstate', (e)=>{
			setSelectedKeys([e.target['location']['pathname']]);

			let openKey = '/'+e.target['location']['pathname'].split('/')[1]
			if (rootSubmenuKeys.includes(openKey)) {
				setOpenKeys([openKey])
			}
		})

		return () => {
			PubSub.unsubscribe(menuSub);
		}
	}, []);

	const primaryClick = (item) => {
		navigate(item['key'])
		setSelectedKeys([item['key']])
	}

	const onOpenChange = (keys) => {
		const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
		if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
			setOpenKeys(keys);
		} else {
			setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
		}
	};

	const list = [
		{
			key: '/dashboard', icon: <DashboardOutlined style={{fontSize: '20px'}}/>, label: '仪表盘'
		},
		{
			key: '/storage', icon: <UploadOutlined style={{fontSize: '20px'}}/>, label: '存储池',
			children: [
				{key: '/storage/disks', label: '物理硬盘'},
				{key: '/storage/pools', label: '存储池列表'}
			]
		},
		{
			key: '/network', icon: <ApartmentOutlined style={{fontSize: '20px'}}/>, label: '网络管理'
		},
		{
			key: '/share', icon: <ShareAltOutlined style={{fontSize: '20px'}}/>, label: 'NAS共享',
			children: [
				{key: '/share/files', label: '共享文件'},
				{key: '/share/protocol', label: '共享协议'},
				{key: '/share/snapshot-manage', label: '快照管理'}
			]
		},
		{
			key: '/task', icon: <SnippetsOutlined style={{fontSize: '20px'}}/>, label: '任务管理',
			children: [
				{key: '/task/snapshot-task', label: '定期快照'},
				{key: '/task/scrub-task', label: '校验任务'},
				{key: '/task/rsync-task', label: '同步任务'}
			]
		},
		{
			key: '/credentials', icon: <UserOutlined style={{fontSize: '20px'}}/>, label: 'NAS账户',
			children: [
				{key: '/credentials/users', label: 'NAS用户'},
				{key: '/credentials/groups', label: 'NAS群组'}
			]
		},
		{
			key: '/system', icon: <SettingOutlined style={{fontSize: '20px'}}/>, label: '系统设置',
			children: [
				{key: '/system/logs', label: '系统日志'},
				{key: '/system/email', label: '邮件预警'},
				{key: '/system/service', label: '服务设置'},
				{key: '/system/update', label: '系统升级'}
			]
		},
	]


	return (
		<Menu
			theme="dark"
			mode="inline"
			selectedKeys={selectedKeys}
			openKeys={openKeys}
			onOpenChange={onOpenChange}
			onClick={primaryClick}
			items={list}
		/>
	);
};
export default MenuList;
