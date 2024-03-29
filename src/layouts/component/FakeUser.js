import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Dropdown } from "antd";
import { PoweroffOutlined, LogoutOutlined } from '@ant-design/icons';
import Cache from "../../utils/Cache";
import warningImg from '../../images/warning.png'
import '../index.css'


const FakeUser = () => {
	const navigate = useNavigate();

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
		}
	];

	return (
		<Row type={'flex'} align={'middle'} style={{marginRight: '1vw'}}>
			<img src={warningImg} alt="" style={{height: '24px', cursor: 'pointer'}} />

			<Dropdown
				menu={{items: powerItems}}
				onOpenChange={flag => setPower(flag)}
				open={powerOpen}
				placement="bottomRight"
			>
				<PoweroffOutlined style={{marginLeft: '1.5vw', fontSize: '22px', cursor: 'pointer'}}/>
			</Dropdown>
			<span style={{marginLeft: '1vw',fontSize: '24px'}}>{userName}</span>
		</Row>
	);
};
export default FakeUser;
