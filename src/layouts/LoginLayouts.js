import React, { useEffect, useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Layout, Spin, Form, Input, Button, notification } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom'
import PubSub from 'pubsub-js'
import { WebSocketService } from '../server'
import {EventMessage, URL} from '../server/enum'
import { isEmpty, getUUID } from "../utils/cmn";
import { usernameValidator, passwordValidator, tipsText } from '../pages/credentials/users/helptext'
import Cache from "../utils/Cache";
import './index.css'

const { Content } = Layout;
const FormItem = Form.Item;


const LoginLayout = () => {
	Cache.removeUserInfo();
	const [loading, setSpin] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();
	let loginSub = null, tokenSub = null;

	// componentDidMount componentWillUnmount
	useEffect(() => {
		Cache.removeUserInfo();
		if (location.search && location.search.indexOf('expired')) {
			notification.warning({message: '令牌已过期，请重新登录。'});
		}
		PubSub.unsubscribe(loginSub);
		PubSub.unsubscribe(tokenSub);
		return () => {
			PubSub.unsubscribe(loginSub);
			PubSub.unsubscribe(tokenSub);
		}
	}, []);

	const handleSubmit = values => {
		const {username, password} = values;
		if (WebSocketService) {
			const uuid = getUUID();
			loginSub = PubSub.subscribe(uuid, (_, {result})=>{loginCallback(result, username)})
			WebSocketService.call(uuid, URL.LOGIN, [username, password]);
		}
	}

	const loginCallback = (result, username) => {
		if (result === 0) {
		// if (result) {
			notification.success({message: '登录成功'})
			getToken(username);
		}
		else if(result === 1) {   // 被列入黑名单
			notification.error({message: '登录失败', description: '该IP地址已被列入黑名单'});
		}
		else if(result === 2) {   // 暂时封禁
			notification.error({message: '登录失败', description: '密码错误次数过多，用户已被暂时封禁，请稍后再试'});
		}
		else if(result === 3) {   // 用户名密码错误
			notification.error({message: '登录失败', description: '用户名或密码错误'});
		}
	}

	// 登录成功后 获取token
	const getToken = username => {
		const uuid = getUUID();
		tokenSub = PubSub.subscribe(uuid, (_, {result})=>{
			Cache.saveUserInfo({username, token: result})
			navigate('/index')
		})
		WebSocketService.call(uuid, URL.GET_TOKEN, [300]);

		// 开启主动推送功能
		WebSocketService.send({
			id: getUUID(),
			name: '*',
			msg: EventMessage.Sub,
		});
	}


	return (
		<Layout className="full-layout login-page">
			<Content>
				<Spin tip="登录中..." spinning={!!loading}>
					<Form onFinish={handleSubmit} className="login-form">
						<div className="user-img">
							<b>Smart Store</b>
							<span> - 登录</span>
						</div>
						{/*<div className="login-title">*/}
						{/*	<b>Storage Manager</b>*/}
						{/*</div>*/}
						<FormItem name="username" rules={[{ validator: usernameValidator, message: tipsText.usernameMsg }, { required: true, message: tipsText.usernameRequire }]}>
							<Input
								size="large"
								prefix={<UserOutlined />}
								placeholder="用户名"
							/>
						</FormItem>
						<FormItem name="password" rules={[{ validator: passwordValidator, message: tipsText.passwordMsg }, { required: true, message: tipsText.passwordRequire }]}>
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
						>
							登录
						</Button>
					</Form>
				</Spin>
			</Content>
		</Layout>
	);
};
export default LoginLayout;
