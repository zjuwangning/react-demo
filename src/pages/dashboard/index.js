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
import './index.less'

let sysSub = null,
	querySub = null;

let timer = null

const nameArr = {bandWidthWrite: '写带宽', bandWidthRead: '读带宽', ioWrite: '写IOPS', ioRead: '读IOPS'}

function Dashboard() {
	const [bandwidth, setBandwidth] = useState([])
	const [io, setIO] = useState([])

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
		querySub = PubSub.subscribe(uuid, (_, {result})=>{
			let bandwidthData = [], ioData = [];
			let bandwidthReadIndex = result[0]['legend'].indexOf('bandwidth_iops_br')
			let bandwidthWriteIndex = result[0]['legend'].indexOf('bandwidth_iops_bw')
			let ioReadIndex = result[0]['legend'].indexOf('bandwidth_iops_iopsr')
			let ioWriteIndex = result[0]['legend'].indexOf('bandwidth_iops_iopsw')
			for (let k in result[0]['data']) {
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
			setBandwidth(bandwidthData)
			setIO(ioData)
		})
		WebSocketService.call(uuid, URL.REPORT_GET, [[{name: "bandwidth_iops"}], {start: date-3600, end: date}]);
	}

	const bandwidthScale = {
		rwValue: { min: 0 },
		rwType: {
			formatter: v => {
				return {
					bandWidthWrite: '写带宽',
					bandWidthRead: '读带宽'
				}[v]
			}
		}
	}
	const ioScale = {
		rwValue: { min: 0 },
		rwType: {
			formatter: v => {
				return {
					ioWrite: '写IOPS',
					ioRead: '读IOPS'
				}[v]
			}
		}
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
			<Row type={'flex'} style={{width: '100%', height: 'calc(45vh - 90px)'}}>
				<Col span={8} style={{height: '100%', paddingRight: '0.5vw'}}>
					<Panel title="系统信息" height={'calc(45vh - 150px)'}>
						<SysInfo />
					</Panel>
				</Col>
				<Col span={8} style={{paddingLeft: '0.5vw', paddingRight: '0.25vw'}}>
					<Panel title="容量使用率" height={'calc(45vh - 150px)'}>
						<Volume />
					</Panel>
				</Col>
				<Col span={8} style={{paddingLeft: '0.75vw'}}>
					<Panel title="处理器占用" height={'calc(45vh - 150px)'}>
						<Cpu />
					</Panel>
				</Col>
			</Row>
			<Row type={'flex'} style={{width: '100%', height: 'calc(55vh - 90px)'}}>
				<Col span={12} style={{paddingRight: '0.5vw'}}>
					<Panel title="带宽" height={'calc(55vh - 150px)'}>
						<Chart
							scale={bandwidthScale}
							padding={[30, 20, 60, 80]}
							autoFit height={320}
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
				<Col span={12} style={{paddingLeft: '0.5vw'}}>
					<Panel title="IOPS" height={'calc(55vh - 150px)'}>
						<Chart
							scale={ioScale}
							padding={[30, 20, 60, 80]}
							autoFit height={320}
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
