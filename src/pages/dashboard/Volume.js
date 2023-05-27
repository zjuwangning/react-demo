import React, {useEffect, useState} from 'react';
import PubSub from "pubsub-js";
import { Row, Col } from 'antd'
import Ring from './Ring'
import { getUUID, isEmpty, getVolume } from "../../utils/cmn";
import {WebSocketService} from "../../server";
import {URL} from "../../server/enum";
import './index.less'

let querySub = null;

function Volume() {
	const [volume, setVolume] = useState({ available: 0, used: 0 })
	const [myData, setData] = useState([{ type: "已使用", percent: 0 }, { type: "可使用", percent: 1 }])
	const [myContent, setContent] = useState({ title: "容量使用率", percent: "0%" })
	const [color, setColor] = useState('#5B8FF9')

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getDataset();

		return () => {
			PubSub.unsubscribe(querySub);
		}
	}, []);

	// 获取系统信息
	const getDataset = () => {
		let uuid = getUUID();
		querySub = PubSub.subscribe(uuid, (_, {result})=>{
			if (result && result.length>0) {
				let temp = {available: 0, used: 0};
				for (let k in result) {
					if (result[k]['id'].indexOf('/')<0) {
						temp['used'] += result[k]['used']['parsed'];
						temp['available'] += result[k]['available']['parsed'];
					}
				}
				let percent = temp['used']/(temp['used']+temp['available'])
				let color = '#5B8FF9'
				if (percent > 0.85) {
					color = '#e03215'
				}
				setVolume(temp);
				setColor(color);
				setData([{ type: "已使用", percent  }, { type: "可使用", percent: temp['available']/(temp['used']+temp['available']) }])
				setContent({ title: "容量使用率", percent: (Number(temp['used']/(temp['used']+temp['available']))*100).toFixed(2)+'%' })
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY);
	}

	return (
		<Row type={'flex'} style={{height: '100%', width: '100%'}}>
			<Col span={16}>
				<Ring data={myData} content={myContent} color={color}/>
			</Col>
			{
				isEmpty(volume['available']) || volume['available']===0?'':(
					<Col span={8}>
						<Row style={{marginTop: '10px'}}><span className={'volume-text'}>总计：{getVolume(volume['used']+volume['available'])}</span></Row>
						<Row style={{marginTop: '20px'}}><span className={'volume-text'}>已用：{getVolume(volume['used'])}</span></Row>
						<Row style={{marginTop: '20px'}}><span className={'volume-text'}>可用：{getVolume(volume['available'])}</span></Row>
					</Col>
				)
			}
		</Row>
	);
}

export default Volume;
