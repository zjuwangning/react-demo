import React, {useEffect, useState} from 'react';
import PubSub from "pubsub-js";
import { Row, Col } from 'antd'
import Ring from './Ring'
import { getUUID, isEmpty, getVolume } from "../../utils/cmn";
import {WebSocketService} from "../../server";
import {URL} from "../../server/enum";
import './index.less'

let querySub = null;

function Cpu() {
	const [cpu, setCpu] = useState({ tempMax: 0, tempMaxList: [], useMax: 0, useMaxList: [] })
	const [myData, setData] = useState([{ type: "占用", percent: 0 }, { type: "空闲", percent: 1 }])
	const [myContent, setContent] = useState({ title: "平均占用", percent: "0%" })
	const [color, setColor] = useState('#5B8FF9')

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getCpu();

		// 开启CPU数据实时上报
		let uuid = getUUID();
		WebSocketService.sub(uuid, URL.CPU_REPORT)

		return () => {
			PubSub.unsubscribe(querySub);
			WebSocketService.unsub(uuid);
		}
	}, []);

	// 开启订阅 获取CPU实时信息
	const getCpu = () => {
		querySub = PubSub.subscribe(URL.CPU_REPORT, (_, {result})=>{
			if (result && result['average']) {
				let color = '#5B8FF9'
				if (result.average.usage.toFixed(1)>85) color = '#e03215'
				setData([{ type: "占用", percent: result.average.usage.toFixed(1)/100 }, { type: "空闲", percent: 1-(result.average.usage.toFixed(1)/100) }])
				setContent({ title: "平均占用", percent: result.average.usage.toFixed(1)+"%" })
				setColor(color)
				parseCpuData(result);
			}
		})
	}

	// 计算最高占用线程和最高温度
	const parseCpuData = (cpuData) => {
		let usageColumn = []
		for (let k in cpuData) {
			if (k+'' === Number(k)+'') {
				usageColumn.push(Number((100-cpuData[k]['idle']).toFixed(1)));
			}
		}
		let useMax = 0, useMaxList = [];
		for (let k in usageColumn) {
			if (usageColumn[k]>useMax) {
				useMax = usageColumn[k]
				useMaxList = [Number(k)]
			}
			else if (usageColumn[k]===useMax) {
				useMaxList.push(Number(k))
			}
		}
		let tempMax = 0, tempMaxList = [];
		for (let k in cpuData['temperature_celsius']) {
			if (cpuData['temperature_celsius'][k]>tempMax) {
				tempMax = cpuData['temperature_celsius'][k]
				tempMaxList = [Number(k)]
			}
			else if (cpuData['temperature_celsius'][k]===tempMax) {
				tempMaxList.push(Number(k))
			}
		}
		setCpu({tempMax, tempMaxList, useMax, useMaxList})
	}

	return (
		<Row type={'flex'} style={{height: '100%', width: '100%'}}>
			<Col span={16}>
				<Ring data={myData} content={myContent} color={color}/>
			</Col>
			{
				cpu['useMaxList'].length===0||cpu['tempMaxList'].length===0?'':(
					<Col span={8}>
						<Row style={{marginTop: '10px'}}><span className={'volume-text'}>占用：{(myData[0]['percent']*100).toFixed(1)}%</span></Row>
						<Row style={{marginTop: '20px'}}><span className={'volume-text'}>空闲：{(myData[1]['percent']*100).toFixed(1)}%</span></Row>
						<Row style={{marginTop: '20px'}}><span className={'volume-text'}>温度：{cpu['tempMax']} ℃</span></Row>
					</Col>
				)
			}
		</Row>
	);
}

export default Cpu;
