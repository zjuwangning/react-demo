import React, {useEffect, useState} from 'react';
import PubSub from "pubsub-js";
import { Row, Col, Tag } from 'antd'
import {getUUID, isEmpty} from "../../utils/cmn";
import {WebSocketService} from "../../server";
import {URL} from "../../server/enum";
import logo from "../../images/logo.png";
import './index.less'

let sysSub = null;

function SysInfo() {
	const [sysInfo, setInfo] = useState({})

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getSysInfo();

		return () => {
			PubSub.unsubscribe(sysSub);
		}
	}, []);

	// 获取系统信息
	const getSysInfo = () => {
		let uuid = getUUID();
		sysSub = PubSub.subscribe(uuid, (_, {result})=>{
			setInfo(result);
		})
		WebSocketService.call(uuid, URL.SYS_INFO);
	}

	return (
		<Row type={'flex'} style={{height: '100%', width: '100%', overflowX: 'auto'}}>
			<img src={logo} alt="" style={{height: '100%'}}/>
			<Col style={{height: '100%'}}>
				<Row type={'flex'} align={'middle'} style={{height: '100%'}}>
					<div>
						<Row className={'dash-title'}>SmarStor NAS</Row>
						<Row className={'dash-sub-title'}>Storage manager</Row>
					</div>
				</Row>
			</Col>
			<Col style={{marginLeft: '50px'}}>
				<Row type={'flex'} style={{marginTop: '2vh'}}>
					<Tag color={'green'}>主机名</Tag><span style={{marginRight: '30px'}}>SmarStorNAS</span>
					<Tag color={'orange'}>运行时间</Tag>{isEmpty(sysInfo['uptime_seconds'])?'':(
					Math.floor(Number(sysInfo['uptime_seconds'])/86400) + '天'
					+ Math.floor(Number(sysInfo['uptime_seconds'])%86400/3600) + '小时'
					+ Math.floor(Number(sysInfo['uptime_seconds'])%86400%3600/60) + '分钟'
				)}
				</Row>
				<Row type={'flex'} style={{marginTop: '3vh'}}>
					<Tag color={'red'}>版本号</Tag><span style={{marginRight: '30px'}}>{sysInfo['version']}</span>
				</Row>
				<Row type={'flex'} style={{marginTop: '3vh'}}>
					<Tag color={'blue'}>cpu核数</Tag>
					<span style={{marginRight: '30px'}}>
									{sysInfo['physical_cores']} 核心（{sysInfo['cores']} 线程）
								</span>
					<Tag color={'orange'}>内存大小</Tag>
					{isEmpty(sysInfo['physmem'])?'':(Number(sysInfo['physmem'])/1024/1024/1024).toFixed(1)} GB
				</Row>
			</Col>
		</Row>
	);
}

export default SysInfo;
