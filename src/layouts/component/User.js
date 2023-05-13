import React, { useEffect, useState } from 'react';
import { Row, Tooltip, Dropdown, Divider, Space, Button, theme, notification, Tag, Badge } from "antd";
import { PoweroffOutlined } from '@ant-design/icons';
import {useLocation, useNavigate} from "react-router-dom";
import PubSub from "pubsub-js";
import moment from "moment";
import {SubEvent} from "../enum";
import Cache from "../../utils/Cache";
import warningImg from '../../images/warning.png'
import {getUUID} from "../../utils/cmn";
import {WebSocketService} from "../../server";
import {URL} from "../../server/enum";
import '../index.css'

const { useToken } = theme;
let fetchSub = null;  // 获取所有数据
let timer = null;

const User = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const [userName, setUserName] = useState('');
	const [open, setOpen] = useState(false);
	const [items, setItem] = useState([]);
	const [numbers, setNum] = useState(false);

	// componentDidMount
	useEffect(() => {
		const userInfo = Cache.getUserInfo();
		if (userInfo && userInfo['username']) {
			setUserName(userInfo['username'])
		}
		else {
			navigate('/login')
		}
		// 轮询更新警报数据
		getLogs();
		if (timer !== null) {
			clearInterval(timer);
		}
		timer = setInterval(getLogs, 5000);

		return () => {
			PubSub.unsubscribe(fetchSub);
			if (timer !== null) {
				clearInterval(timer);
				timer = null;
			}
		}

	}, []);

	const logOut = () => {
		Cache.removeUserInfo();
		navigate('/login')
	}

	// 获取系统日志
	const getLogs = () => {
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let temp = [], flag=false;
				for (let k=result.length-1; k>=0; k--) {
					if (!['INFO', 'NOTICE', 'WARNING'].includes(result[k]['level'])) {
						if (temp.length >= 5) {
							flag = true
							break ;
						}
						temp.push({
							key: k,
							label: (
								<div style={{margin: '10px 0', width: '600px', borderBottom: '1px lightgray solid'}}>
									<Row style={{marginBottom: '5px'}}>
										<Tag color={'red'}>错误</Tag>
										{moment(result[k]['datetime']['$date']).format('YYYY-MM-DD HH:mm:ss')}
									</Row>
									<div dangerouslySetInnerHTML={{__html: result[k]['formatted']}} />
								</div>
							),
						})
					}
				}
				setItem(temp)
				setNum(flag)
			}
		})
		WebSocketService.call(uuid, URL.LOGS_QUERY);
	}

	// 查看系统日志页面
	const viewLogs = () => {
		if (location['pathname'] === '/system/logs') {
			notification.warning({message: '当前已在系统日志页面'});
			return ;
		}
		PubSub.publish(SubEvent.SWITCH_PAGE, '/system/logs')
		setOpen(false);
	}

	const handleOpenChange = (flag) => {
		setOpen(flag);
	};


	const { token } = useToken();
	const contentStyle = {
		backgroundColor: token.colorBgElevated,
		borderRadius: token.borderRadiusLG,
		boxShadow: token.boxShadowSecondary,
	};
	const menuStyle = {
		boxShadow: 'none',
		maxHeight: '70vh',
		overflowY: 'auto'
	};

	return (
		<Row type={'flex'} align={'middle'} style={{marginRight: '1vw'}}>
			<Dropdown
				menu={{items}}
				dropdownRender={(menu) => (
					<div style={contentStyle}>
						<Space style={{padding: 8, fontSize: '20px', fontWeight: 'bold'}}>
							&nbsp;&nbsp;系统警报
						</Space>
						<Divider style={{margin: 0,}}/>
						{React.cloneElement(menu, {
							style: menuStyle,
						})}
						<Divider style={{margin: 0,}}/>
						<Space style={{padding: 8,}}>
							&nbsp;&nbsp;<Button type="primary" onClick={viewLogs}>查看更多</Button>&nbsp;&nbsp;
						</Space>
					</div>
				)}
				onOpenChange={handleOpenChange}
				open={open}
			>
				<Badge count={numbers?'...':items.length}>
					<img src={warningImg} alt="" style={{height: '24px', cursor: 'pointer'}}/>
				</Badge>

			</Dropdown>
			<Tooltip placement="bottom" title={'退出登录'}>
				<PoweroffOutlined style={{marginLeft: '1.5vw', fontSize: '22px', cursor: 'pointer'}} onClick={logOut}/>
			</Tooltip>
			<span style={{marginLeft: '0.5vw',fontSize: '24px'}}>{userName}</span>
		</Row>
	);
};
export default User;
