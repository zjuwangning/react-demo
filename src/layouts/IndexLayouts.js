import React, { useEffect } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined, UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Layout, theme, Breadcrumb, Row } from 'antd';
import { useNavigate, useLocation, Link } from 'react-router-dom'
import BasicRouter from '../route/BasicRouter';
import Footer from "./component/Footer";
import Menu from "./component/Menu";
import './index.css'

const { Header, Sider, Content } = Layout;


const IndexLayout = () => {


	useEffect(authentication, [])

	const authentication = () => {

	}

	return (
		<div>
			123
		</div>
	);
};
export default IndexLayout;
