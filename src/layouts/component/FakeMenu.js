import React, { useEffect } from 'react';
import { DashboardOutlined, UploadOutlined, ShareAltOutlined, UserOutlined, SettingOutlined, SnippetsOutlined, ApartmentOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import '../index.css'

const FakeMenuList = () => {

	// componentDidMount
	useEffect(() => {

		return () => {}
	}, []);

	const list = [
		{
			key: '/dashboard', icon: <DashboardOutlined style={{fontSize: '20px'}}/>, label: '仪表盘'
		},
		{
			key: '/storage', icon: <UploadOutlined style={{fontSize: '20px'}}/>, label: '存储池',
		},
		{
			key: '/network', icon: <ApartmentOutlined style={{fontSize: '20px'}}/>, label: '网络管理'
		},
		{
			key: '/share', icon: <ShareAltOutlined style={{fontSize: '20px'}}/>, label: 'NAS共享'
		},
		{
			key: '/task', icon: <SnippetsOutlined style={{fontSize: '20px'}}/>, label: '任务管理'
		},
		{
			key: '/credentials', icon: <UserOutlined style={{fontSize: '20px'}}/>, label: 'NAS账户'
		},
		{
			key: '/system', icon: <SettingOutlined style={{fontSize: '20px'}}/>, label: '系统设置'
		},
	]


	return (
		<Menu
			theme="dark"
			mode="inline"
			items={list}
		/>
	);
};
export default FakeMenuList;
