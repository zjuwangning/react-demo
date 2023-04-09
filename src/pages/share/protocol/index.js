import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, notification, Table } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let fetchSub = null,
	startSub = null,
	stopSub = null;
const nameList = {'ftp': 'FTP', 'cifs': 'SMB', 'nfs': 'NFS', 'webdav': 'WebDAV'}

function ShareProtocol() {
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 数据集列表
	const [loading, setLoading] = useState(false);

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();

		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(startSub);
			PubSub.unsubscribe(stopSub);
		}
	}, []);

	// 获取共享协议
	const getData = () => {
		setLoading(true);
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			setLoading(false);
			if (error) {
				notification.error({message: '数据获取错误，请稍后重试'});
			}
			else {
				let temp = [];
				for (let k in result) {
					if (['ftp', 'cifs', 'nfs', 'webdav'].includes(result[k]['service'])) temp.push(result[k])
				}
				setData(temp);
			}
		})
		WebSocketService.call(uuid, URL.SERVICE_QUERY);
	}

	// 启用共享协议
	const start = r => {
		setLoading(true);
		let uuid = getUUID();
		startSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				setLoading(false);
				notification.error({message: '启用协议错误，请稍后重试'});
			}
			else {
				if (result) {
					notification.success({message: '启用协议成功'});
					getData();
				}
				else {
					setLoading(false);
					notification.warning({message: '启用协议失败，请稍后重试'});
				}
			}
		})
		WebSocketService.call(uuid, URL.SERVICE_START, [r['service']]);
	}

	// 禁用共享协议
	const stop = r => {
		setLoading(true);
		let uuid = getUUID();
		stopSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				setLoading(false);
				notification.error({message: '禁用协议错误，请稍后重试'});
			}
			else {
				if (result) {
					notification.success({message: '禁用协议成功'});
					getData();
				}
				else {
					setLoading(false);
					notification.warning({message: '禁用协议失败，请稍后重试'});
				}
			}
		})
		WebSocketService.call(uuid, URL.SERVICE_STOP, [r['service']]);
	}

	// routers 页面跳转
	const routers = r => {
		let path = r['service']
		if (path === 'cifs') path = 'smb'
		navigate('/share/protocol/'+path);
	}

	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '80px',
			render: (t,r,i)=>i+1
		},
		{
			title: '协议名称',
			dataIndex: 'service',
			width: '170px',
			render: t => nameList[t]
		},
		{
			title: '状态',
			dataIndex: 'state',
			width: '130px',
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '220px',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{start(r)}} disabled={r['state']!=='STOPPED'}>启用</Button>
						<Button type={'link'} size={'small'} onClick={()=>{stop(r)}} disabled={r['state']!=='RUNNING'}>禁用</Button>
						<Button type={'link'} size={'small'} onClick={()=>{routers(r)}}>设置</Button>
					</Row>
				)
			}
		},
	];



	return (
		<>
			<div className={'full-page'}>
				<Row className={'title'}>共享协议</Row>
				<Row className={'sub-title'}>查看协议状态，修改和启用/禁用协议。</Row>
				<Row className={'actions'} />
				<Table
					size={'middle'}
					style={{width: '600px'}}
					columns={columns}
					rowKey={(record) => record.id || record.name}
					dataSource={data}
					pagination={false}
					loading={loading}
					childrenColumnName={'notallow'}
				/>
			</div>
		</>
	);
}

export default ShareProtocol;
