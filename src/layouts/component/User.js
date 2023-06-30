import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { Row, Dropdown } from "antd";
import { PoweroffOutlined, LogoutOutlined } from '@ant-design/icons';
import Cache from "../../utils/Cache";
import '../index.css'


const User = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const [userName, setUserName] = useState('');
	const [powerOpen, setPower] = useState(false);

	// componentDidMount
	useEffect(() => {
		const userInfo = Cache.getUserInfo();
		if (userInfo && userInfo['username']) {
			setUserName(userInfo['username'])
		}
		else {
			navigate('/login')
		}

		return () => {}

	}, []);

	const logOut = () => {
		Cache.removeUserInfo();
		navigate('/login')
	}


	const powerItems = [
		{
			key: '1',
			label: (
				<Row type={'flex'} align={'middle'} style={{padding: '5px'}} onClick={logOut}>
					<LogoutOutlined style={{fontSize: '20px'}}/>
					<span style={{fontSize: '16px', marginLeft: '10px'}}>登出</span>
				</Row>
			),
		},
	];

	return (
		<div>
			<Dropdown
				menu={{items: powerItems}}
				onOpenChange={flag => setPower(flag)}
				open={powerOpen}
				placement="bottomRight"
			>
				<PoweroffOutlined style={{marginLeft: '1.5vw', fontSize: '22px', cursor: 'pointer', color: 'white'}}/>
			</Dropdown>
			<span style={{marginLeft: '1vw',fontSize: '24px', color: 'white'}}>{userName}</span>
		</div>
	);
};
export default User;
