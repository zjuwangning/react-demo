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
		<div style={{height: '100%', width: '100%', overflowX: 'auto'}}>
			{/*<img src={logo} alt="" style={{height: '100%'}}/>*/}
			<Row type={'flex'} style={{marginTop: '2vh'}}>
				<Tag color={'green'}>主机名</Tag>
				<span style={{width: '130px'}}>SmarStorNAS</span>
				<Tag color={'green'}>运行时间</Tag>{isEmpty(sysInfo['uptime_seconds'])?'':(
				<span>
						{Math.floor(Number(sysInfo['uptime_seconds'])/86400) + '天'
						+ Math.floor(Number(sysInfo['uptime_seconds'])%86400/3600) + '小时'
						+ Math.floor(Number(sysInfo['uptime_seconds'])%86400%3600/60) + '分钟'}
					</span>
			)}
			</Row>
			<Row type={'flex'} style={{marginTop: '3vh'}}>
				<Tag color={'green'}>处理器</Tag>
				<span  style={{width: '130px'}}>
									{sysInfo['physical_cores']} 核心 ({sysInfo['cores']} 线程)
								</span>
				<Tag color={'green'}>内存大小</Tag>
				{isEmpty(sysInfo['physmem'])?'':(Number(sysInfo['physmem'])/1024/1024/1024).toFixed(1)} GB
			</Row>
			<Row type={'flex'} style={{marginTop: '3vh'}}>
				<Tag color={'green'}>版本号</Tag><span style={{marginRight: '30px'}}>{sysInfo['version']}</span>
			</Row>
		</div>
	);
}

export default SysInfo;
