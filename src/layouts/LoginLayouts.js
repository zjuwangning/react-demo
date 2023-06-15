import React, { useEffect, useState } from 'react';
import { LockOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { Row, Layout, Form, Input, Button, notification } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom'
import PubSub from 'pubsub-js'
import { WebSocketService } from '../server'
import { EventMessage, URL } from '../server/enum'
import { getUUID } from "../utils/cmn";
import { product } from "../component/DiskSlot/enum";
import { usernameValidator, passwordValidator, tipsText } from '../pages/credentials/users/helptext'
import Cache from "../utils/Cache";
import './index.css'

const { Content } = Layout;
const FormItem = Form.Item;
let timer = null;
let loginSub = null, tokenSub = null, typeSub = null;

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

		return () => {
			PubSub.unsubscribe(loginSub);
			PubSub.unsubscribe(tokenSub);
			PubSub.unsubscribe(typeSub);

			if (timer!==null) {
				clearInterval(timer)
			}
		}
	}, []);

	//
	const handleSubmit = values => {
		const {username, password} = values;
		setLoading(true);
		if (WebSocketService) {
			const uuid = getUUID();
			loginSub = PubSub.subscribe(uuid, (_, {error, result})=>{
				setLoading(false);
				if (error) {
					notification.error({message: '登录失败', description: error.reason});
				}
				else {
					loginCallback(result, username)
				}
			})
			WebSocketService.call(uuid, URL.LOGIN, [username, password]);
		}
	}

	//
	const loginCallback = (result, username) => {
		if (result === 0) {
		// if (result) {
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
			getType(username, result);
		})
		WebSocketService.call(uuid, URL.GET_TOKEN, [300]);

		// 开启主动推送功能
		WebSocketService.send({
			id: getUUID(),
			name: '*',
			msg: EventMessage.Sub,
		});
	}

	// 获取设备类型 用于硬盘槽位的对应
	const getType = (username, token) => {
		let uuid = getUUID();
		typeSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '登录成功但设备类型获取错误，请联系管理员！'});
				Cache.saveUserInfo({username, token})
				navigate('/index')
			}
			else {
				// getList(Number(result+''))
				if (result && result['product_type'] && typeof product[result['product_type']]==='number') {
					notification.success({message: '登录成功'})

					Cache.saveUserInfo({username, token, productType: product[result['product_type']]})
				}
				else {
					notification.error({message: '登录成功但设备类型获取错误，请联系管理员！'});
					Cache.saveUserInfo({username, token})
				}
				navigate('/index')
			}
		})
		WebSocketService.call(uuid, URL.PROD_TYPE);
	}



	return (
		<Layout className="full-layout login-page">
			<Content>
				<Row type={'flex'} justify={'center'} align={'middle'} style={{width: '100%', height: '100%'}}>
					<div className={'login-div'}>
						<Form onFinish={handleSubmit} className="login-form">
							<div className="login-title">
								用户登录
							</div>
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
