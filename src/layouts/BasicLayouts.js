import React, { useState } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Layout, theme, Row, Col } from 'antd';
import BasicRouter from '../route/BasicRouter';
import Footer from "./component/Footer";
import Menu from "./component/Menu";
import User from "./component/User";
import BreadcrumbNavigation from "./component/BreadcrumbNavigation";
import logo from '../images/logo.png'
import './index.css'

const { Header, Sider, Content } = Layout;

const BasicLayout = () => {
	const [collapsed, setCollapsed] = useState(false);

	const {
		token: { colorBgContainer },
	} = theme.useToken();


	return (
		<Layout>
			<Sider trigger={null} collapsible collapsed={collapsed} style={{height: '100vh', overflowY: 'auto'}}>
				{
					collapsed?(
						<Row type={'flex'} justify={'center'} align={'middle'} style={{height: '64px'}}><img src={logo} alt="" style={{height: '40px'}}/></Row>
					):(
						<Row type={'flex'} justify={'center'} align={'middle'} style={{height: '64px', width: '200px'}}>
							<img src={logo} alt="" style={{height: '40px'}}/>
							<span className={'menu-title'}>SmarStor</span>
						</Row>
					)
				}
				<Menu />
			</Sider>
			<Layout className="site-layout">
				<Header style={{padding: '0 10px', background: colorBgContainer,}}>
					<Row type={'flex'} justify={'space-between'} align={'middle'} style={{height: '100%'}}>
						<Col>
							{React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
								className: 'trigger',
								onClick: () => setCollapsed(!collapsed),
							})}
						</Col>
						<Col><User /></Col>
					</Row>
				</Header>
				<Content style={{margin: '0 26px'}}>
					<Row type={'flex'} align={'middle'} style={{height: '50px'}}>
						<BreadcrumbNavigation />
					</Row>
					<div style={{ height: "calc(100vh - 145px)", padding: '12px 25px', background: colorBgContainer }}>
						<BasicRouter />
					</div>
					<Footer />
				</Content>
			</Layout>
		</Layout>
	);
};
export default BasicLayout;
