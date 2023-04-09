import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import { Row, Descriptions, notification } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { isEmpty, getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let datasetSub = null,
	shareSub = null,
	nfsSub = null,
	smbSub = null,
	davSub = null;

const SYNC = {STANDARD: '标准', ALWAYS: '总是', DISABLED: '禁用'}


function FileDetails() {
	const [search] = useSearchParams();
	const [dataset, setDataset] = useState({})        // 共享文件
	const [shareInfo, setShare] = useState('')        // 共享文件

	const [nfsName, setNfs] = useState('')        // nfs挂载路径
	const [smbName, setSmb] = useState('')        // smb挂载路径
	const [davName, setDav] = useState('')        // dav挂载路径


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
			PubSub.unsubscribe(nfsSub);
			PubSub.unsubscribe(smbSub);
			PubSub.unsubscribe(davSub);
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
						if (k === 'nfs') getNfs(result[k]);
						else if (k === 'smb') getSmb(result[k]);
						else if (k === 'webdav') getDav(result[k]);
					}
				}
				if (temp.length>0) temp = temp.slice(0, temp.length-1);
				setShare(temp)
			}
		})
		WebSocketService.call(uuid, URL.DATASET_SHARE_ITEM, [data['mountpoint']]);
	}

	// 获取nfs协议内容
	const getNfs = id => {
		PubSub.unsubscribe(smbSub);
		let uuid = getUUID();
		nfsSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: 'NFS共享获取错误'})
			}
			else {
				setNfs(result[0]['paths'][0])
			}
		})
		WebSocketService.call(uuid, URL.SHARE_NFS_QUERY, [[["id", "=", id]]]);
	}

	// 获取smb协议内容
	const getSmb = id => {
		PubSub.unsubscribe(smbSub);
		let uuid = getUUID();
		smbSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: 'SMB共享获取错误'})
			}
			else {
				setSmb(result[0]['name'])
			}
		})
		WebSocketService.call(uuid, URL.SHARE_SMB_QUERY, [[["id", "=", id]]]);
	}

	// 获取webdav协议内容
	const getDav = id => {
		PubSub.unsubscribe(davSub);
		let uuid = getUUID();
		davSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: 'WEBDAV共享获取错误'})
			}
			else {
				setDav(result[0]['name'])
			}
		})
		WebSocketService.call(uuid, URL.SHARE_DAV_QUERY, [[["id", "=", id]]]);
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
							<Descriptions.Item label="启用协议">{isEmpty(shareInfo)?'N/A':shareInfo}</Descriptions.Item>
							<Descriptions.Item label="同步模式">{SYNC[dataset['sync']['value']]}</Descriptions.Item>
							<Descriptions.Item label="SMB挂载路径">{isEmpty(smbName)?'N/A':smbName}</Descriptions.Item>
							<Descriptions.Item label="WEBDAV挂载路径">{isEmpty(davName)?'N/A':davName}</Descriptions.Item>
							<Descriptions.Item label="NFS挂载路径">{isEmpty(nfsName)?'N/A':nfsName}</Descriptions.Item>
						</Descriptions>
					</Row>
				)
			}
		</div>
	);
}

export default FileDetails;
