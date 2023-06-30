import React, { useState } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Layout, theme, Row, Col } from 'antd';
import BasicRouter from '../route/BasicRouter';
import Footer from "./component/Footer";
import Menu from "./component/Menu";
import User from "./component/User";
import BreadcrumbNavigation from "./component/BreadcrumbNavigation";
import './index.css'

const { Header, Content } = Layout;

const BasicLayout = () => {

	const {
		token: { colorBgContainer },
	} = theme.useToken();


	return (
		<Layout className="layout">
			<Header
				style={{
					display: 'flex',
					alignItems: 'center',
				}}
			>
				<div style={{width: '120px', height: '32px', backgroundColor: 'lightGray', marginRight: '50px'}}/>
				<div style={{flexGrow: 1}}><Menu /></div>
				<div><User /></div>
			</Header>
			<Content>
				<Row type={'flex'} align={'middle'} style={{height: '50px', marginLeft: '36px'}}>
					<BreadcrumbNavigation />
				</Row>
				<BasicRouter />
			</Content>
		</Layout>
	);
};
export default BasicLayout;
