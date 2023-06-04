import React, {useEffect, useState} from 'react';
import PubSub from "pubsub-js";
import dayjs from 'dayjs'
import { Row, Col } from 'antd'
import {getUUID, isEmpty} from "../../utils/cmn";
import {WebSocketService} from "../../server";
import {URL} from "../../server/enum";
import './index.less'

let timer = null;
let sysSub = null;
let start = 0

function SysInfo({size=516}) {
	let fontSize = 14, height = 50
	if (size) {
		fontSize = Math.floor(size/36)
		height = Math.floor(size/8)
	}
	fontSize+='px'
	height+='px'

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
		<div style={{height: '100%', width: size<380?'360px':'100%', overflowX: 'auto'}}>
			{/*<img src={logo} alt="" style={{height: '100%'}}/>*/}
			<Row type={'flex'} style={{height}}>
				<Col span={12}>
					<Row type={'flex'} align={'middle'}>
						<div className={'tag-div-info'} style={{fontSize}}>主机名</div>
						<span style={{fontSize}}>SmarStorNAS</span>
					</Row>
				</Col>
				<Col span={12}>
					<Row type={'flex'}>
						<div className={'tag-div-info'} style={{fontSize}}>运行时间</div>
						{
							isEmpty(sysInfo['uptime_seconds'])?'':(
								<span style={{fontSize}}>
									{Math.floor(Number(sysInfo['uptime_seconds'])/86400) + '天'
									+ Math.floor(Number(sysInfo['uptime_seconds'])%86400/3600) + '小时'
									+ Math.floor(Number(sysInfo['uptime_seconds'])%86400%3600/60) + '分钟'}
								</span>
							)
						}
					</Row>
				</Col>
			</Row>
			<Row type={'flex'} style={{height}}>
				<Col span={12}>
					<Row type={'flex'}>
						<div className={'tag-div-info'} style={{fontSize}}>处理器</div>
						<span style={{fontSize}}>{sysInfo['physical_cores']} 核心 ({sysInfo['cores']} 线程)</span>
					</Row>
				</Col>
				<Col span={12}>
					<Row type={'flex'}>
						<div className={'tag-div-info'} style={{fontSize}}>内存大小</div>
						{isEmpty(sysInfo['physmem'])?'':<span style={{fontSize}}>{(Number(sysInfo['physmem'])/1024/1024/1024).toFixed(1)} GB</span>}
					</Row>
				</Col>
			</Row>
			<Row type={'flex'} style={{height}}>
				<Col span={24}>
					<Row>
						<div className={'tag-div-info'} style={{fontSize}}>版本号</div>
						<span style={{fontSize}}>{sysInfo['version']}</span>
					</Row>
				</Col>
			</Row>
			{
				warning?(
					<Row type={'flex'} style={{height}}>
						<Col span={24}>
							<Row type={'flex'}>
								<div className={'tag-div-warning'} style={{fontSize}}>警告</div>
								<span style={{fontSize}}>NAS时间 {remoteTime} 与本地时间相差过大</span>
							</Row>
						</Col>
					</Row>
				):''
			}
		</div>
	);
}

export default SysInfo;
