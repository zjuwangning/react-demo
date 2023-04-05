import React, {useEffect, useState} from 'react';
import PubSub from "pubsub-js";
import { Row, Col, Tag, Progress } from 'antd'
import { getUUID, isEmpty, getVolume } from "../../utils/cmn";
import {WebSocketService} from "../../server";
import {URL} from "../../server/enum";
import './index.less'

let querySub = null;

function Volume() {
	const [volume, setVolume] = useState({})

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
			let temp = {total: 0, used: 0};
			for (let k in result) {
				if (result[k]['id'].indexOf('/')<0) {
					temp['used'] += result[k]['used']['parsed'];
					temp['total'] += result[k]['used']['parsed'];
					temp['total'] += result[k]['available']['parsed'];
				}
			}
			setVolume(temp);
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY);
	}

	return (
		<div style={{height: '100%', width: '100%', overflowX: 'auto'}}>
			{
				isEmpty(volume['total']) || volume['total']===0?'':(
					<>
						<Row type={'flex'} style={{height: '40px', width: '600px', paddingLeft: '40px'}}>
							<span className={'volume-text'}>{(volume['used']/volume['total']*100).toFixed(2)}% 已使用</span>
							<span className={'volume-text'} style={{marginLeft: '80px'}}>已用：{getVolume(volume['used'])}</span>
							<span className={'volume-text'} style={{margin: '0 8px'}}>/</span>
							<span className={'volume-text'}>总计：{getVolume(volume['total'])}</span>
						</Row>
						<Row type={'flex'} style={{height: '25px', width: '600px'}}>
							<Progress percent={volume['used']/volume['total']*100} size={[600, 20]} showInfo={false}/>
						</Row>
					</>
				)
			}
		</div>
	);
}

export default Volume;
