import React, { useEffect, useState } from 'react';
import { DashboardOutlined, UploadOutlined, ShareAltOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom'
import PubSub from "pubsub-js";
import { SubEvent } from '../enum'
import '../index.css'


const MenuList = () => {
	const [openKeys, setOpenKeys] = useState(['']);
	const [selectedKeys, setSelectedKeys] = useState(['']);
	const navigate = useNavigate();
	const location = useLocation();
	let menuSub = null;

	// componentDidMount
	useEffect(() => {
		setSelectedKeys([location.pathname]);
		menuSub = PubSub.subscribe(SubEvent.SWITCH_PAGE, (_, url)=>{
			navigate(url)
			setSelectedKeys([url])
		})

		return () => {
			PubSub.unsubscribe(menuSub);
		}
	}, []);

	const primaryClick = (item) => {
		navigate(item['key'])
		setSelectedKeys([item['key']])
	}


	const rootSubmenuKeys = ['/storage', '/share', '/credentials', '/system'];
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
				{key: '/storage/disks', label: '硬盘列表'},
				{key: '/storage/pools', label: '存储池列表'}
			]
		},
		{
			key: '/share', icon: <ShareAltOutlined style={{fontSize: '20px'}}/>, label: 'NAS共享',
			children: [
				{key: '/share/files', label: '共享文件'},
				{key: '/share/protocol', label: '共享协议'},
				{key: '/share/snapshot-manage', label: '快照管理'},
				{key: '/share/snapshot-task', label: '定期快照'}
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
				{key: '/system/network', label: '网络管理'},
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
