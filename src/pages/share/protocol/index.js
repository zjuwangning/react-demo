import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import {Row, Button, notification, Table, Modal, Switch} from "antd";
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
				if (result && result.length>0) {
					temp = result
				}
				setData(temp);
			}
		})
		WebSocketService.call(uuid, URL.SERVICE_QUERY, [[['service', 'in', ['ftp', 'cifs', 'nfs', 'webdav']]]]);
	}

	// 修改运行状态
	const onChangeState = (r, state) => {
		setLoading(true);
		let url = state?URL.SERVICE_START:URL.SERVICE_STOP;
		let uuid = getUUID();
		stopSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				setLoading(false);
				Modal.error({
					title: '操作错误',
					content: error.reason
				})
			}
			else {
				if (state === result) {
					notification.success({message: '操作成功'});
					getData();
				}
				else {
					setLoading(false);
					Modal.error({
						title: '开启失败',
						content: '没有对应协议的共享文件时，可能无法开启共享协议，需先创建对应协议的共享文件。'
					})
				}
			}
		})
		WebSocketService.call(uuid, url, [r['service']]);
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
			width: '100px',
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
			render: (t, r) => {
				return (
					<Switch
						style={{marginLeft: '0.5vw'}} checkedChildren="运行" unCheckedChildren="停止"
						checked={t==='RUNNING'}
						onClick={checked=>{onChangeState(r, checked)}}
					/>
				)
			}
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '100px',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
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
					style={{width: '500px'}}
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
