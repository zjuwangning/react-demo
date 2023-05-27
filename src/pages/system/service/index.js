import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, notification, Table, Modal, Switch } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let fetchSub = null,
	startSub = null,
	stopSub = null,
	editSub = null;
const nameList = {'ssh': 'SSH'}

function SystemService() {
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
			PubSub.unsubscribe(editSub);
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
		WebSocketService.call(uuid, URL.SERVICE_QUERY, [[['service', 'in', ['ssh']]]]);
	}

	// routers 页面跳转
	const routers = r => {
		let path = r['service']
		navigate('/system/service/'+path);
	}

	// 修改运行状态
	const onChangeState = (r, state) => {
		setLoading(true);
		let url = state?URL.SERVICE_START:URL.SERVICE_STOP;
		let uuid = getUUID();
		stopSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				setLoading(false);
				Modal.error({
					title: '操作错误',
					content: error.reason
				})
			}
			else {
				getData();
			}
		})
		WebSocketService.call(uuid, url, [r['service']]);
	}

	// 修改自启状态
	const onChangeEnabled = (r, enable) => {
		setLoading(true);
		let uuid = getUUID();
		editSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				Modal.error({
					title: '修改失败',
					content: error.reason
				})
				setLoading(false);
			}
			else {
				getData();
			}
		})
		WebSocketService.call(uuid, URL.SERVICE_UPDATE, [r['id'], {enable}]);
	}

	//
	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '80px',
			render: (t,r,i)=>i+1
		},
		{
			title: '服务名称',
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
			title: '自启',
			dataIndex: 'enable',
			width: '150px',
			render: (t, r) => {
				return (
					<Switch
						style={{marginLeft: '0.5vw'}} checkedChildren="开启" unCheckedChildren="关闭"
						checked={t}
						onClick={checked=>{onChangeEnabled(r, checked)}}
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
		<div className={'full-page'}>
			<Row className={'title'}>服务设置</Row>
			<Row className={'sub-title'}>查看系统服务状态，编辑系统服务配置，设置系统服务启动选项。</Row>
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
	);
}

export default SystemService;
