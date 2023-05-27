import React, {useEffect, useState} from 'react';
import PubSub from "pubsub-js";
import dayjs from 'dayjs'
import { Row, Tag } from 'antd'
import {getUUID, isEmpty} from "../../utils/cmn";
import {WebSocketService} from "../../server";
import {URL} from "../../server/enum";
import './index.less'

let timer = null;
let sysSub = null;
let start = 0

function SysInfo() {
	const [sysInfo, setInfo] = useState({})
	const [warning, setWarning] = useState(false)
	const [remoteTime, setTime] = useState('')

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getSysInfo();

		return () => {
			PubSub.unsubscribe(sysSub);
			if (timer !== null) {
				clearInterval(timer)
			}
		}
	}, []);

	// 获取系统信息
	const getSysInfo = () => {
		let uuid = getUUID();
		sysSub = PubSub.subscribe(uuid, (_, {result})=>{
			setInfo(result);
			timeDiff(result)
		})
		WebSocketService.call(uuid, URL.SYS_INFO);
	}

	// 判断系统时间
	const timeDiff = item => {
		if (item && item['datetime'] && item['datetime']['$date']) {
			// 服务器时间和本地时间差300秒以上
			if (Number(dayjs().format('x'))-item['datetime']['$date'] > 300000 || Number(dayjs().format('x'))-item['datetime']['$date'] < -300000) {
				setWarning(true);
				setTime(dayjs(item['datetime']['$date']).format());
				start = item['datetime']['$date'];
				if (timer !== null) {
					clearInterval(timer)
				}
				timer = setInterval(()=>{
					start+=1000
					setTime(dayjs(start).format());
				}, 1000)
			}
		}
	}

	return (
		<div style={{height: '100%', width: '100%', overflowX: 'auto'}}>
			{/*<img src={logo} alt="" style={{height: '100%'}}/>*/}
			<Row type={'flex'} style={{marginTop: '2vh'}}>
				<Tag color={'green'}>主机名</Tag>
				<span style={{width: '130px'}}>SmarStorNAS</span>
				<Tag color={'green'}>运行时间</Tag>
				{
					isEmpty(sysInfo['uptime_seconds'])?'':(
						<span>
							{Math.floor(Number(sysInfo['uptime_seconds'])/86400) + '天'
							+ Math.floor(Number(sysInfo['uptime_seconds'])%86400/3600) + '小时'
							+ Math.floor(Number(sysInfo['uptime_seconds'])%86400%3600/60) + '分钟'}
						</span>
					)
				}
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
			{
				warning?(
					<Row type={'flex'} style={{marginTop: '3vh'}}>
						<Tag color={'red'}>警告</Tag>
						<span style={{marginRight: '30px'}}>NAS时间 {remoteTime} 与本地时间相差过大</span>
					</Row>
				):''
			}
		</div>
	);
}

export default SysInfo;
