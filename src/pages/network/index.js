import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, InputNumber, notification, Table, Modal } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../server/enum";
import {getUUID, isEmpty} from "../../utils/cmn";
import { WebSocketService } from "../../server";
import './index.less'

let networkSub = null, pendingSub = null, waitingSub = null, rollbackSub = null, saveSub = null;
let timer = null;
let remainingTimes = null;

function ShareFiles() {
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 数据集列表
	const [loading, setLoading] = useState(false);
	const [hasPending, setPending] = useState(false);
	const [hasWaiting, setWaiting] = useState(false);
	const [seconds, setSeconds] = useState(60);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 10,
		},
	});

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();
		getPending();
		getWaiting();

		return () => {
			PubSub.unsubscribe(networkSub);PubSub.unsubscribe(pendingSub);PubSub.unsubscribe(waitingSub);
			PubSub.unsubscribe(rollbackSub);PubSub.unsubscribe(saveSub);
			if (timer!==null) {
				clearInterval(timer)
			}
		}
	}, []);

	// 获取所有数据集 及 数据集共享情况
	const getData = () => {
		setLoading(true);
		let uuid = getUUID();
		networkSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
				setLoading(false);
			}
			else {
				setLoading(false);
				setData(result)
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_QUERY);
	}

	// 查询是否有pending数据
	const getPending = () => {
		let uuid = getUUID();
		pendingSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				if (result) setPending(true)
				else setPending(false)
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_PENDING);
	}

	// 查询是否有waiting数据
	const getWaiting = () => {
		let uuid = getUUID();
		waitingSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				if (result !== null) {
					setWaiting(true)
					if (result>0 && remainingTimes === null) {
						remainingTimes = Math.round(result);
						if (timer!== null) clearInterval(timer)
						timer = setInterval(()=>{
							if (remainingTimes>0) {
								setSeconds(remainingTimes);
								remainingTimes-=1;
							}
							else {
								clearInterval(timer)
								timer = null
								window.location.reload();
							}
						}, 1000)
					}
				}
				else {
					setWaiting(false)
					setSeconds(60)
					remainingTimes = null;
					if (timer!== null) {
						clearInterval(timer)
						timer = null;
					}
				}
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_WAITING);
	}

	// 测试更改
	const commitPendingChanges = () => {
		Modal.confirm({
			title: '测试网络接口更改',
			content: '是否确认测试网络接口变化？网络连接可能会因此中断。',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					rollbackSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: '测试网络接口更改失败，请稍后重试'})
						}
						else {
							getData();
							getPending();
							getWaiting();
						}
					})
					WebSocketService.call(uuid, URL.NETWORK_TEST, [{checkin_timeout: seconds+''}]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// 永久保存更改
	const checkInNow = () => {
		Modal.confirm({
			title: '保存更改',
			content: '是否确认永久保存网络更改。',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					saveSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: '保存更改失败，请稍后重试'})
						}
						else {
							notification.success({message: '网络配置更改已永久保存'});
							setWaiting(false)
							setSeconds(60)
							remainingTimes = null;
							if (timer!== null) {
								clearInterval(timer)
								timer = null;
							}
							getData();
							getPending();
							getWaiting();
						}
					})
					WebSocketService.call(uuid, URL.NETWORK_SAVE);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// 还原更改
	const rollbackPendingChanges = () => {
		Modal.confirm({
			title: '还原网络接口更改',
			content: '是否确认还原界面更改？未永久保存的所有更改都将丢失。',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					rollbackSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: '还原网络接口更改失败，请稍后重试'})
						}
						else {
							getData();
							getPending();
						}
					})
					WebSocketService.call(uuid, URL.NETWORK_ROLLBACK);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			...sorter,
		});

		if (pagination.pageSize !== tableParams.pagination?.pageSize) {
			setData([]);
		}
	};

	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '5%',
			render: (t,r,i)=>i+1
		},
		{
			title: '网卡',
			dataIndex: 'name',
			width: '10%',
		},
		{
			title: '状态',
			dataIndex: 'state',
			width: '10%',
			render: t => t&&t['link_state']&&t['link_state']==='LINK_STATE_UP'?'RUNNING':'N/A'
		},
		{
			title: 'IP',
			dataIndex: 'aliases',
			width: '12%',
			render: t => t&&t.length>0?t[0]['address']:''
		},
		{
			title: '子网掩码',
			dataIndex: 'aliases',
			width: '12%',
			render: t => t&&t.length>0?t[0]['netmask']:''
		},
		{
			title: '支持速度',
			dataIndex: 'state',
			width: '10%',
			render: t => t&&t['supported_media']&&t['supported_media'].length>0?t['supported_media'][0]:''
		},
		{
			title: '当前速度',
			dataIndex: 'state',
			width: '13%',
			render: t => t&&t['active_media_subtype']?t['active_media_subtype']:''
		},
		{
			title: 'MTU',
			dataIndex: 'state',
			width: '8%',
			render: t => t&&t['mtu']?t['mtu']:''
		},
		{
			title: '绑定模式',
			dataIndex: 'type',
			width: '12%',
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '8%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/network/config?id='+r['id'])}}>配置</Button>
					</Row>
				)
			}
		},
	];

	return (
		<div className={'full-page'}>
			<Row className={'title'}>网络管理</Row>
			<Row className={'sub-title'}>进行网络的配置和修改</Row>
			<Row className={'actions'}>
				<Button type={'primary'} onClick={()=>{navigate('/network/global-config')}}>全局配置</Button>
				<Button type={'primary'} style={{marginLeft: '20px'}} onClick={()=>{navigate('/network/bond')}}>绑定</Button>
			</Row>
			{
				hasPending?(
					<div className={'info-card'}>
						{
							hasWaiting?(
								<>
									<Row>网络接口设置已临时更改以进行测试。测试期间，您可点击保存更改按钮，以永久保存修改。</Row>
									<Row style={{marginTop: '10px'}}>{seconds} 秒后，未永久保存的更改即会还原到编辑前状态。</Row>
								</>
							):(
								<>
									<Row>在永久保存之前必须测试未应用的网络接口更改。现在测试更改？</Row>
									<Row type={'flex'} align={'middle'} style={{marginTop: '10px'}}>
										测试网络接口更改&nbsp;&nbsp;&nbsp;
										<InputNumber className={'info-input'} value={seconds} onChange={seconds=>setSeconds(seconds)}/>
										&nbsp;&nbsp;&nbsp;秒。
									</Row>
								</>
							)
						}
						<Row type={'flex'} style={{marginTop: '20px'}}>
							{
								hasWaiting?(
									<Button type={'primary'} onClick={checkInNow}>保存更改</Button>
								):(
									<Button type={'primary'} onClick={commitPendingChanges}>测试更改</Button>
								)
							}
							<Button type={'primary'} onClick={rollbackPendingChanges} style={{marginLeft: '20px'}}>还原更改</Button>
						</Row>
					</div>
				):''
			}
			<Table
				size={'middle'}
				columns={columns}
				rowKey={(record) => record.id || record.name}
				dataSource={data}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				childrenColumnName={'notallow'}
			/>
		</div>
	);
}

export default ShareFiles;
