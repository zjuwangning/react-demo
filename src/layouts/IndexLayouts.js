import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import Cache from '../utils/Cache'
import './index.css'


const IndexLayout = () => {
	const navigate = useNavigate();

	useEffect(() => {
		loginState();

		return () => {}
	}, [])

	// 登录判断 判断是否登录
	const loginState = () => {
		// 登录校验 未登录需跳转到登录页面
		let userInfo = Cache.getUserInfo();
		if (userInfo && userInfo['token']) {
			navigate('/homepage')
		}
		else {
			navigate('/login')
		}
	}


	return (
		<div>

		</div>
	);
};
export default IndexLayout;
