import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import { Row, Descriptions, notification } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { isEmpty, getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let datasetSub = null,
	shareSub = null;
const SYNC = {STANDARD: '标准', ALWAYS: '总是', DISABLED: '禁用'}


function FileDetails() {
	const [search] = useSearchParams();
	const [dataset, setDataset] = useState({})        // 共享文件
	const [shareInfo, setShare] = useState('')        // 共享文件


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('id')) {
				getDataset();
			}
			else {
				// 数据没有拿到id 跳转错误
			}
		}

		return () => {
			PubSub.unsubscribe(datasetSub);
			PubSub.unsubscribe(shareSub);
		}
	}, []);

	// 获取共享文件数据
	const getDataset = () => {
		let uuid = getUUID();
		datasetSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				setDataset(result[0])
				getShare(result[0])
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[["id", "=", search.get('id')]]]);
	}

	// 获取共享文件的共享情况
	const getShare = data => {
		let uuid = getUUID();
		shareSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let temp = ''
				for (let k in result) {
					if (result[k]) {
						temp+=k+'+'
					}
				}
				if (temp.length>0) temp = temp.slice(0, temp.length-1);
				setShare(temp)
			}
		})
		WebSocketService.call(uuid, URL.DATASET_SHARE_ITEM, [data['mountpoint']]);
	}



	return (
		<div className={'full-page'}>
			<Row className={'title'}>共享文件详细信息</Row>
			<Row className={'sub-title'}>显示共享文件的详细信息</Row>
			{
				isEmpty(dataset)?'':(
					<Row type={'flex'} style={{marginTop: '2vh'}}>
						<Descriptions bordered column={2}>
							<Descriptions.Item label="共享文件名称">{dataset['name'].slice(dataset['pool'].length+1)}</Descriptions.Item>
							<Descriptions.Item label="磁盘池名">{dataset['pool']}</Descriptions.Item>
							<Descriptions.Item label="已用容量">{dataset['used']['value']}</Descriptions.Item>
							<Descriptions.Item label="可用容量">{dataset['available']['value']}</Descriptions.Item>
							<Descriptions.Item label="启用协议">{shareInfo}</Descriptions.Item>
							<Descriptions.Item label="同步模式">{SYNC[dataset['sync']['value']]}</Descriptions.Item>
							<Descriptions.Item label="NFS挂载路径"></Descriptions.Item>
							<Descriptions.Item label="SMB挂载路径"></Descriptions.Item>
						</Descriptions>
					</Row>
				)
			}
		</div>
	);
}

export default FileDetails;
