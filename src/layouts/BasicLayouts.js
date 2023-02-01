import React, { useState } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined, UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import { useNavigate } from 'react-router-dom'
import BasicRouter from '../route/BasicRouter';

const { Header, Sider, Content } = Layout;


const BasicLayout = () => {
	const [collapsed, setCollapsed] = useState(false);

	const {
		token: { colorBgContainer },
	} = theme.useToken();

	const navigate = useNavigate();
	const primaryClick = (item) => {
		navigate(item['key'])
	}

	return (
		<Layout>
			<Sider trigger={null} collapsible collapsed={collapsed}>
				<div className="logo" />
				<Menu
					theme="dark"
					mode="inline"
					defaultSelectedKeys={['/user']}
					onClick={primaryClick}
					items={[
						{
							key: '/user',
							icon: <UserOutlined />,
							label: 'nav 1',
						},
						{
							key: '/data',
							icon: <UploadOutlined />,
							label: 'nav 2',
						},
					]}
				/>
			</Sider>
			<Layout className="site-layout">
				<Header style={{padding: 0, background: colorBgContainer,}}>
					{React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
						className: 'trigger',
						onClick: () => setCollapsed(!collapsed),
					})}
				</Header>
				<Content
					style={{
						margin: '24px 16px',
						padding: 24,
						minHeight: 280,
						background: colorBgContainer,
					}}
				>
					<BasicRouter />
				</Content>
			</Layout>
		</Layout>
	);
};
export default BasicLayout;
