import React, {useEffect, useState} from 'react';
import { Row, Col } from 'antd'
import { Chart, Axis, Legend, Geom, Tooltip } from 'bizcharts';
import PubSub from "pubsub-js";
import moment from 'moment'
import SysInfo from "./SysInfo";
import Volume from "./Volume";
import Cpu from "./Cpu";
import Panel from '../../component/Panel'
import { getUUID, getBandwidth, getIops } from "../../utils/cmn";
import { WebSocketService } from "../../server";
import { URL } from "../../server/enum";
import Cache from "../../utils/Cache";
import './index.less'

let sysSub = null,
	querySub = null;
let timer = null
const nameArr = {bandWidthWrite: '写带宽', bandWidthRead: '读带宽', ioWrite: '写IOPS', ioRead: '读IOPS'}


function Dashboard() {
	let screenInfo = {width: window.screen.availWidth, height: window.screen.availHeight};
	let width1 = 0, width2 = 0;
	// 左侧菜单200px  margin 26px*2 padding 25px*2  共302px  可用1920-302=1618px 计算一下页面窗体宽度
	if (screenInfo && screenInfo.width) {
		width1 = (screenInfo.width - 302 - 70)/3;
		width2 = (screenInfo.width - 302 - 50)/2;
	}
	else {
		window.location.href = '/login'
	}

	const [bandwidth, setBandwidth] = useState([])
	const [io, setIO] = useState([])
	const [bwMax, setBwMax] = useState(524288000)
	const [ioMax, setIoMax] = useState(5000)

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();
		getInterval();

		return () => {
			PubSub.unsubscribe(sysSub);
			PubSub.unsubscribe(querySub);
			if (timer !== null) {
				clearInterval(timer);
			}
		}
	}, []);

	// 轮询表格数据
	const getInterval = () => {
		if (timer !== null) {
			clearInterval(timer)
		}
		timer = setInterval(getData, 10000);
	}

	// 获取带宽/io信息
	const getData = () => {
		let date = new Date();
		date = Number((date.getTime()/1000).toFixed(0))-20
		let uuid = getUUID();
		querySub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if(error) return;
			let bandwidthData = [], ioData = [], bwMaxTemp = 524288000, ioMaxTemp = 5000;
			let bandwidthReadIndex = result[0]['legend'].indexOf('bandwidth_iops_br')
			let bandwidthWriteIndex = result[0]['legend'].indexOf('bandwidth_iops_bw')
			let ioReadIndex = result[0]['legend'].indexOf('bandwidth_iops_iopsr')
			let ioWriteIndex = result[0]['legend'].indexOf('bandwidth_iops_iopsw')
			for (let k in result[0]['data']) {
				if (result[0]['data'][k][bandwidthReadIndex] > bwMaxTemp) bwMaxTemp = result[0]['data'][k][bandwidthReadIndex]
				if (result[0]['data'][k][bandwidthWriteIndex] > bwMaxTemp) bwMaxTemp = result[0]['data'][k][bandwidthWriteIndex]
				if (result[0]['data'][k][ioReadIndex] > ioMaxTemp) ioMaxTemp = result[0]['data'][k][ioReadIndex]
				if (result[0]['data'][k][ioWriteIndex] > ioMaxTemp) ioMaxTemp = result[0]['data'][k][ioWriteIndex]
				bandwidthData.push({
					time: moment.unix(result[0]['start']+(Number(k)*result[0]['step'])).format('HH:mm:ss'),
					rwType: "bandWidthRead",
					rwValue: result[0]['data'][k][bandwidthReadIndex]
				})
				bandwidthData.push({
					time: moment.unix(result[0]['start']+(Number(k)*result[0]['step'])).format('HH:mm:ss'),
					rwType: "bandWidthWrite",
					rwValue: result[0]['data'][k][bandwidthWriteIndex]
				})
				ioData.push({
					time: moment.unix(result[0]['start']+(Number(k)*result[0]['step'])).format('HH:mm:ss'),
					rwType: "ioRead",
					rwValue: result[0]['data'][k][ioReadIndex]
				})
				ioData.push({
					time: moment.unix(result[0]['start']+(Number(k)*result[0]['step'])).format('HH:mm:ss'),
					rwType: "ioWrite",
					rwValue: result[0]['data'][k][ioWriteIndex]
				})
			}
			bwMaxTemp = Math.ceil(bwMaxTemp/500/1024/1024)*500*1024*1024
			ioMaxTemp = Math.ceil(ioMaxTemp/5000)*5000
			setBwMax(bwMaxTemp)
			setIoMax(ioMaxTemp)
			setBandwidth(bandwidthData)
			setIO(ioData)
		})
		WebSocketService.call(uuid, URL.REPORT_GET, [[{name: "bandwidth_iops"}], {start: date-3600, end: date}]);
	}

	const label = {
		formatter(text, item, index) {
			return getBandwidth(text);
		}
	}
	const ioLabel = {
		formatter(text, item, index) {
			return getIops(text);
		}
	}


	return (
		<div className={'full-page'}>
			<Row type={'flex'} justify={'start'} style={{width: '100%', minWidth: width2+20+'px', margin: 'auto'}}>
				<Col style={{width: width1+'px', height: width1*0.6+'px', marginRight: '20px', marginBottom: '20px'}}>
					<Panel title="系统信息" height={width1*0.6-40+'px'}>
						<SysInfo size={width1}/>
					</Panel>
				</Col>
				<Col style={{width: width1+'px', height: width1*0.6+'px', marginRight: '20px', marginBottom: '20px'}}>
					<Panel title="容量使用率" height={width1*0.6-40+'px'}>
						<Volume size={width1}/>
					</Panel>
				</Col>
				<Col style={{width: width1+'px', height: width1*0.6+'px', marginBottom: '20px'}}>
					<Panel title="处理器状态" height={width1*0.6-40+'px'}>
						<Cpu size={width1}/>
					</Panel>
				</Col>
			</Row>
			<Row type={'flex'} justify={'start'} style={{width: '100%', minWidth: width2+20+'px', margin: 'auto'}}>
				<Col style={{width: width2+'px', height: width2*0.5+'px', marginRight: '20px', marginBottom: '20px'}}>
					<Panel title="带宽" height={width2*0.5-40+'px'}>
						<Chart
							scale={{
								rwValue: { type:"linear", min: 0, max: bwMax, tickInterval: bwMax/5 },
								rwType: {formatter: v => {return {bandWidthWrite: '写带宽', bandWidthRead: '读带宽'}[v]}}
							}}
							padding={[30, 20, 60, 80]}
							autoFit
							height={width2*0.4}
							data={bandwidth}
							interactions={['element-active']}
						>
							<Legend />
							<Axis name="time" />
							<Axis name="rwValue" label={label}/>
							<Tooltip shared showCrosshairs/>
							<Geom type="line" tooltip={['rwValue*rwType', (value, name) => {
								return {
									value: `${getBandwidth(value)}`,
									name: nameArr[name]
								}
							}]} position="time*rwValue" size={2} color={'rwType'} />
						</Chart>
					</Panel>
				</Col>
				<Col style={{width: width2+'px', height: width2*0.5+'px', marginBottom: '20px'}}>
					<Panel title="IOPS" height={width2*0.5-40+'px'}>
						<Chart
							scale={{
								rwValue: {  type:"linear", min: 0, max: ioMax, tickInterval: ioMax/5  },
								rwType: {formatter: v => {return {ioWrite: '写IOPS', ioRead: '读IOPS'}[v]}}
							}}
							padding={[30, 20, 60, 80]}
							autoFit
							height={width2*0.4}
							data={io}
							interactions={['element-active']}
						>
							<Legend />
							<Axis name="time" />
							<Axis name="rwValue" label={ioLabel}/>
							<Tooltip shared showCrosshairs/>
							<Geom type="line" tooltip={['rwValue*rwType', (value, name) => {
								return {
									value: `${getIops(value)}`,
									name: nameArr[name]
								}
							}]} position="time*rwValue" size={2} color={'rwType'} />
						</Chart>
					</Panel>
				</Col>
			</Row>
		</div>
	);
}

export default Dashboard;
