import React, {useEffect, useState} from 'react';
import { Row, Tooltip } from "antd";
import { PoweroffOutlined } from '@ant-design/icons';
import Cache from "../../utils/Cache";
import {useNavigate} from "react-router-dom";
import '../index.css'


const User = () => {
	const [userName, setUserName] = useState('');
	const navigate = useNavigate();

	// componentDidMount
	useEffect(() => {
		const userInfo = Cache.getUserInfo();
		if (userInfo && userInfo['username']) {
			setUserName(userInfo['username'])
		}
		else {
			navigate('/login')
		}
	}, []);

	const logOut = () => {
		Cache.removeUserInfo();
		navigate('/login')
	}


	return (
		<Row type={'flex'} align={'middle'} style={{marginRight: '1vw'}}>
			<span style={{fontSize: '24px'}}>{userName}</span>
			<Tooltip placement="bottom" title={'退出登录'}>
				<PoweroffOutlined style={{marginLeft: '0.5vw', fontSize: '22px', cursor: 'pointer'}} onClick={logOut}/>
			</Tooltip>
		</Row>
	);
};
export default User;
