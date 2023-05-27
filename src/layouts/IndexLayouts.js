import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import Cache from '../utils/Cache'
import './index.css'
import PubSub from "pubsub-js";
import {getUUID} from "../utils/cmn";
import {WebSocketService} from "../server";
import {URL} from "../server/enum";
import {notification} from "antd";

let authSub = null;

const IndexLayout = () => {
	const navigate = useNavigate();

	useEffect(() => {
		navigate('/dashboard')

		loginState();
		return () => {
			PubSub.unsubscribe(authSub);
		}
	}, [])

	// 登录判断 判断是否登录
	const loginState = () => {
		// 登录校验 未登录需跳转到登录页面
		let userInfo = Cache.getUserInfo();
		if (userInfo && userInfo['token']) {
			authState();
		}
		else {
			navigate('/login')
		}
	}

	// 授权判断 判断是否授权
	const authState = () => {
		const uuid = getUUID();
		authSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '获取授权出错，请联系管理员！'})
			}
			else {
				if (result && result['state'] === true) {
					navigate('/dashboard')
				}
				else if (result && result['state'] === false) {
					navigate('/license')
				}
			}
		})
		WebSocketService.call(uuid, URL.LICENSE_VERIFY, );
	}


	return (
		<div>

		</div>
	);
};
export default IndexLayout;
