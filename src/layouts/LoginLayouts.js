import React, {useEffect, useState} from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Layout, Spin, Form, Input, Button, notification } from 'antd';
import { useNavigate } from 'react-router-dom'
import PubSub from 'pubsub-js'
import { URL } from '../server/enum'
import { isEmpty, getUUID } from "../utils/cmn";
import Cache from "../utils/Cache";
import './index.css'

const { Content } = Layout;
const FormItem = Form.Item;


const LoginLayout = () => {
	const [loading, setSpin] = useState(false);
	const navigate = useNavigate();
	let websocket = null;
	let loginSub = null, tokenSub = null;

	// componentDidMount componentWillUnmount
	useEffect(() => {
		Cache.removeUserInfo();
		PubSub.unsubscribe(loginSub);
		PubSub.unsubscribe(tokenSub);
		return () => {
			PubSub.unsubscribe(loginSub);
			PubSub.unsubscribe(tokenSub);
		}
	}, []);

	const handleSubmit = values => {
		const {username, password} = values;
		websocket = window.websocket;
		if (websocket) {
			const uuid = getUUID();
			websocket.call(uuid, URL.LOGIN, [username, password]);
			loginSub = PubSub.subscribe(uuid, (_, result)=>{loginCallback(result, username)})
		}
	}

	const loginCallback = (result, username) => {
		if (result === 0) {
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
		websocket.call(uuid, URL.GET_TOKEN, [300]);
		tokenSub = PubSub.subscribe(uuid, (_, token)=>{
			Cache.saveUserInfo({username, token})
			navigate('/index')
		})
	}

	const usernameValidator = (_, value) => {
		const reg = /^[a-zA-Z0-9]{4,16}$/
		if (isEmpty(value)) {
			return Promise.resolve();
		}
		if (reg.test(value)) {
			return Promise.resolve();
		}
		return Promise.reject();
	}

	const passwordValidator = (_, value) => {
		const reg = /^[a-zA-Z0-9]{6,16}$/
		if (isEmpty(value)) {
			return Promise.resolve();
		}
		if (reg.test(value)) {
			return Promise.resolve();
		}
		return Promise.reject();
	}


	return (
		<Layout className="full-layout login-page">
			<Content>
				<Spin tip="登录中..." spinning={!!loading}>
					<Form onFinish={handleSubmit} className="login-form">
						<div className="user-img">
							<b>SmartNAS</b>
							<span> - 登录</span>
						</div>
						<FormItem name="username" rules={[{ validator: usernameValidator, message: '用户名长度为4-16且只能包含数字、大小写字母' }, { required: true, message: '请输入您的用户名' }]}>
							<Input
								size="large"
								prefix={<UserOutlined />}
								placeholder="用户名"
							/>
						</FormItem>
						<FormItem name="password" rules={[{ validator: passwordValidator, message: '密码长度为6-16且只能包含数字、大小写字母' }, { required: true, message: '请输入您的密码' }]}>
							<Input
								size="large"
								prefix={<LockOutlined />}
								type="password"
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
