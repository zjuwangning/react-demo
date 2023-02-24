import React, { useState } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Layout, theme, Breadcrumb, Row } from 'antd';
import { useLocation, Link } from 'react-router-dom'
import BasicRouter from '../route/BasicRouter';
import Footer from "./component/Footer";
import Menu from "./component/Menu";
import './index.css'

const { Header, Sider, Content } = Layout;


const BasicLayout = () => {
	const [collapsed, setCollapsed] = useState(false);

	const {
		token: { colorBgContainer },
	} = theme.useToken();

	const location = useLocation();

	const pathSnippets = location.pathname.split('/').filter((i) => i);
	const extraBreadcrumbItems = pathSnippets.map((_, index) => {
		const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
		return (
			<Breadcrumb.Item key={url}>
				<Link to={url}>{url}</Link>
			</Breadcrumb.Item>
		);
	});
	const breadcrumbItems = [
		<Breadcrumb.Item key="home">
			<Link to="/">Home</Link>
		</Breadcrumb.Item>,
	].concat(extraBreadcrumbItems);


	return (
		<Layout>
			<Sider trigger={null} collapsible collapsed={collapsed} style={{height: '100vh', overflowY: 'auto'}}>
				<div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
				<Menu />
			</Sider>
			<Layout className="site-layout">
				<Header style={{padding: '0 10px', background: colorBgContainer,}}>
					{React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
						className: 'trigger',
						onClick: () => setCollapsed(!collapsed),
					})}
				</Header>
				<Content style={{margin: '0 26px'}}>
					<Row type={'flex'} align={'middle'} style={{height: '50px'}}>
						<Breadcrumb>
							{breadcrumbItems}
						</Breadcrumb>
					</Row>
					<div style={{ height: "calc(100vh - 145px)", padding: 12, background: colorBgContainer }}>
						<BasicRouter />
					</div>
					<Footer />
				</Content>
			</Layout>
		</Layout>
	);
};
export default BasicLayout;
