import React, { useEffect, useState } from 'react';
import { LockOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { Row, Layout, Form, Input, Button, notification } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom'
import Cache from "../utils/Cache";
import './index.css'

const { Content } = Layout;
const FormItem = Form.Item;

const LoginLayout = () => {
	Cache.removeUserInfo();
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	// componentDidMount componentWillUnmount
	useEffect(() => {
		Cache.removeUserInfo();
		if (location.pathname && location.pathname==='/login/expired') {
			notification.warning({message: '令牌已过期，请重新登录。'});
		}

		return () => {}
	}, []);

	//
	const handleSubmit = values => {
		const {username, password} = values;

		Cache.saveUserInfo({username, token: username})
		navigate('/index')
	}



	return (
		<Layout className="login-page">
			<Content>
				<Row type={'flex'} justify={'center'} align={'middle'} style={{width: '100%', height: '100%'}}>
					<div className={'login-div'}>
						<Form onFinish={handleSubmit} className="login-form">
							<div className="login-title">
								用户登录
							</div>
							<FormItem name="username" >
								<Input
									size="large"
									prefix={<UserOutlined />}
									placeholder="用户名"
								/>
							</FormItem>
							<FormItem name="password" >
								<Input.Password
									size="large"
									prefix={<LockOutlined />}
									placeholder="密码"
								/>
							</FormItem>
							<Button
								size="large"
								type="primary"
								htmlType="submit"
								className="login-form-button"
								loading={loading}
							>
								登录
							</Button>
						</Form>
					</div>
				</Row>
			</Content>
		</Layout>
	);
};

export default LoginLayout;
