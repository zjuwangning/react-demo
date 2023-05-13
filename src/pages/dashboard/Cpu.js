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
	const [cpu, setCpu] = useState({ available: 0, used: 0 })
	const [myData, setData] = useState([{ type: "占用", percent: 0 }, { type: "空闲", percent: 1 }])
	const [myContent, setContent] = useState({ title: "平均占用", percent: "0%" })

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
			setData([{ type: "占用", percent: result.average.usage.toFixed(1)/100 }, { type: "空闲", percent: 1-(result.average.usage.toFixed(1)/100) }])
			setContent({ title: "平均占用", percent: result.average.usage.toFixed(1)+"%" })


			parseCpuData(result);
		})
	}

	// 计算最高占用线程和最高温度
	const parseCpuData = (cpuData) => {
		console.log('cpuData', cpuData)
		let usageColumn = []
		for (let k in cpuData) {
			if (k+'' === Number(k)+'') {
				usageColumn.push(Number((100-cpuData[k]['idle']).toFixed(1)));
			}
		}
		let tempMax = 0
		for (let k in cpuData['temperature_celsius']) {
			// if ()
		}
		console.log('usageColumn', usageColumn);
	}

	return (
		<Row type={'flex'} style={{height: '100%', width: '100%'}}>
			<Col span={16}>
				<Ring data={myData} content={myContent} />
			</Col>
			{
				isEmpty(cpu['available']) || cpu['available']===0?'':(
					<Col span={8}>
						<Row style={{marginTop: '10px'}}><span className={'volume-text'}>最高占用：</span></Row>
						<Row style={{marginTop: '20px'}}><span className={'volume-text'}>最高温度：</span></Row>
					</Col>
				)
			}
		</Row>
	);
}

export default Cpu;
