import React, { useEffect, useState } from 'react';
import { DashboardOutlined, UploadOutlined, ShareAltOutlined, UserOutlined, SettingOutlined, SnippetsOutlined, ApartmentOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom'
import PubSub from "pubsub-js";
import { SubEvent } from '../enum'
import homeIcon from '../../images/homepage.png'
import userIcon from '../../images/user.png'
import '../index.css'

const rootSubmenuKeys = ['/credentials'];

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
			key: '/homepage', icon: (<img src={homeIcon} alt="" style={{height: '20px'}}/>), label: '首页'
		},
		{
			key: '/handbook', icon: (<img src={userIcon} alt="" style={{height: '20px'}}/>), label: '图鉴',
			children: [
				{key: '/handbook/character', label: '角色图鉴'},
				{key: '/handbook/relic', label: '遗器图鉴'}
			]
		},
	]


	return (
		<Menu
			theme="dark"
			mode="horizontal"
			selectedKeys={selectedKeys}
			openKeys={openKeys}
			onOpenChange={onOpenChange}
			onClick={primaryClick}
			items={list}
		/>
	);
};
export default MenuList;
