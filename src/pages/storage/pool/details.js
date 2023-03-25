import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import { Row, Descriptions, Progress, Tag, Modal, notification, Table, Button, Form, Select } from "antd";
import PubSub from "pubsub-js";
import moment from "moment";
import { URL } from "../../../server/enum";
import { isEmpty, getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import { PoolScanState, renderState, renderDisk } from "./enum";

let poolSub = null, setSub = null, jobSub = null, handleSub = null,
	diskSub = null, replaceSub = null, poolChange = null, scanSub = null;


function PoolDetails() {
	const [form] = Form.useForm();
	const [search] = useSearchParams();
	const [poolInfo, setPool] = useState({})        // 池数据
	const [topology, setTopology] = useState({})    // topology数据 所有盘使用情况
	const [percent, setPercent] = useState(0)       // 替换进度
	const [replace, setReplace] = useState(false)   // 替换进度Modal窗
	const [record, setRecord] = useState({})     // 要调换的record
	const [options, setOption] = useState([])       // 可用硬盘选项
	const [loading, setLoading] = useState(false)   // 替换过程中按钮的loading
	const [scans, setScan] = useState({})        // 显示scan任务

	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('id')) {
				getAllData()
			}
			else {
				// 数据没有拿到id 跳转错误
			}
		}

		return () => {
			PubSub.unsubscribe(poolSub);PubSub.unsubscribe(setSub);PubSub.unsubscribe(jobSub);PubSub.unsubscribe(handleSub);
			PubSub.unsubscribe(diskSub);PubSub.unsubscribe(replaceSub);PubSub.unsubscribe(poolChange);PubSub.unsubscribe(scanSub);
		}
	}, []);

	// 页面所有需要获取的数据
	const getAllData = () => {
		getPoolInfo(search.get('id'));
		getUnusedDisk();
	}

	// 获取可用硬盘 生成options 用于硬盘替换
	const getUnusedDisk = () => {
		let uuid = getUUID();
		diskSub = PubSub.subscribe(uuid, (_, result)=>{
			let temp = [];
			for (let k in result) {
				temp.push({
					label: `${result[k]['name']}（${result[k]['type']}, ${Number(result[k]['size']/1024/1024/1024).toFixed(0)}GB）`,
					value: result[k]['identifier']
				})
			}
			if (isEmpty(temp)) {
				notification.warning({message: '暂无可用硬盘'})
			}
			setOption(temp);
		})
		WebSocketService.call(uuid, URL.DISK_UNUSED);
	}

	// 获取池信息
	const getPoolInfo = () => {
		let uuid = getUUID();
		poolSub = PubSub.subscribe(uuid, (_, data)=>{
			if (!isEmpty(data) && !isEmpty(data[0])) {
				getDatasetInfo(data[0]);
				subReplace(data[0]);
			}
			else {
				notification.error({message: '存储池信息获取失败'})
			}
		})
		WebSocketService.call(uuid, URL.POOL_QUERY, [[["id", "=", Number(search.get('id'))]]]);
	}

	// 获取数据集信息 用于展示容量
	const getDatasetInfo = data => {
		let uuid = getUUID();
		setSub = PubSub.subscribe(uuid, (_, result)=>{
			if (!isEmpty(result) && !isEmpty(result[0])) {
				generateData(data, result[0]);
			}
			else {
				notification.error({message: '存储池信息获取失败'})
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[["id", "=", data['name']]]]);
	}

	// 开启任务进度监听
	const subReplace = r => {
		replaceSub = PubSub.subscribe('pool.replace-'+r['id'], (_, data)=>{
			setPercent(data['progress']['percent']);
			if (data['state'] === 'SUCCESS') {
				notification.success({message: '硬盘替换完成，等待数据同步'});
			}
			else if (data['state'] === 'FAILED') {
				setLoading(false);
				notification.error({message: '硬盘替换失败'});
			}
		})
		// scanSub
		scanSub = PubSub.subscribe('zfs.pool.scan-'+r['name'], (_, data)=>{
			setScan(data)
		})
		// 接收到新的池数据推送 认为操作成功
		poolChange = PubSub.subscribe('pool.query-'+r['id'], (_, data)=>{
			form.setFieldsValue({disk: undefined})
			setPercent(0);
			setLoading(false);
			setReplace(false);
			getDatasetInfo(data);
			getUnusedDisk();
		})
	}

	// 数据整理 用于显示
	const generateData = (pool, dataset) => {
		let temp = {}
		temp['id'] = pool['id'];
		temp['name'] = pool['name'];
		let color = 'red'
		if (pool['status'] === 'ONLINE') color='green'
		else if (pool['status'] === 'DEGRADED') color='orange'
		temp['status'] = (<Tag color={color}>{pool['status']}</Tag>);
		temp['volume'] = dataset['available']['parsed']+dataset['used']['parsed'];
		temp['volume'] = temp['volume']/1024/1024/1024
		if (temp['volume']>1024) temp['volume'] = (temp['volume']/1024).toFixed(2)+'T'
		else temp['volume'] = temp['volume'] + 'G'
		temp['available'] = dataset['available']['value'];
		temp['used'] = dataset['used']['value'];
		temp['raid'] = pool['topology']['data'][0]['type']
		temp['disks'] = ''
		temp['failures'] = ''
		for (let k in pool['topology']['data'][0]['children']) {
			if (!isEmpty(pool['topology']['data'][0]['children'][k]['disk'])) {
				temp['disks'] += pool['topology']['data'][0]['children'][k]['disk']+'、'
				if (pool['topology']['data'][0]['children'][k]['status'] !== 'ONLINE') temp['failures']+= pool['topology']['data'][0]['children'][k]['disk']+'、'
			}
		}
		for (let k in pool['topology']['cache']) {
			if (!isEmpty(pool['topology']['cache'][k]['disk'])) {
				temp['disks'] +=pool['topology']['cache'][k]['disk']+'、'
				if (pool['topology']['cache'][k]['status'] !== 'ONLINE') temp['failures']+=pool['topology']['cache'][k]['disk']+'、'
			}
		}
		for (let k in pool['topology']['spare']) {
			if (!isEmpty(pool['topology']['spare'][k]['disk'])) {
				temp['disks'] +=pool['topology']['spare'][k]['disk']+'、'
				if (pool['topology']['spare'][k]['status'] !== 'ONLINE') temp['failures']+=pool['topology']['spare'][k]['disk']+'、'
			}
		}
		setScan(pool['scan'])
		setTopology(pool['topology']);
		setPool(temp);
	}

	// 上线/离线硬盘  0离线;1上线;
	const handleDisk = (r, type) => {
		const handleText = ['离线', '上线']
		const handleUrl = [URL.POOL_OFFLINE, URL.POOL_ONLINE]
		if (r['status'] === 'UNAVAIL') {
			notification.error({message: '该硬盘已不可用'})
		}
		else {
			Modal.confirm({
				title: '确认操作',
				content: `是否确认${handleText[type]}硬盘 ${r['disk']}`,
				onOk() {
					return new Promise((resolve, reject) => {
						let uuid = getUUID();
						handleSub = PubSub.subscribe(uuid, (_, result, error)=>{
							if (result) {
								getPoolInfo(search.get('id'));
								getUnusedDisk();
								resolve()
							}
							else if (error) {

							}
						})
						WebSocketService.call(uuid, handleUrl[type], [poolInfo['id'], {label: r['guid']}]);
					}).catch(() => console.log('Oops errors!'));
				}
			})
		}
	}

	// 替换硬盘
	const replaceDisk = r => {
		if (loading) {
			notification.warning({message: '有磁盘替换任务进行中'});
			return ;
		}
		if (r['type'] === 'REPLACING') {
			notification.warning({message: '磁盘正在替换中'});
			return ;
		}
		setRecord(r)
		setReplace(true)
	}

	// 确认替换
	const confirmReplace = values => {
		setLoading(true);
		let uuid = getUUID();
		handleSub = PubSub.subscribe(uuid, (_, result, error)=>{
			if (result) {

			}
			else if (error) {
				setLoading(false);
				notification.error({message: '替换失败'})
				setReplace(false)
			}
		})
		WebSocketService.call(uuid, URL.POOL_REPLACE, [poolInfo['id'], {label: record['guid'], disk: values['disk'], force: true}]);
	}

	// 关闭弹窗
	const onCancel = () => {
		form.setFieldsValue({disk: undefined})
		setReplace(false)
	}

	// columns
	const dataColumns = [
		{title: '序号', dataIndex: 'index', width: '15%', render: (t,r,i)=>i+1},
		{title: '磁盘', dataIndex: 'disk', width: '20%', render: renderDisk},
		{
			title: '状态',
			dataIndex: 'status',
			width: '25%',
			render: renderState
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '40%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{handleDisk(r, 1)}}>上线</Button>
						<Button type={'link'} size={'small'} onClick={()=>{handleDisk(r, 0)}}>离线</Button>
						<Button type={'link'} size={'small'} onClick={()=>{replaceDisk(r)}}>替换</Button>
					</Row>
				)
			}
		},
	]
	const columns = [
		{title: '序号', dataIndex: 'index', width: '20%', render: (t,r,i)=>i+1},
		{title: '磁盘', dataIndex: 'disk', width: '40%', render: t => t?t:'N/A'},
		{
			title: '状态',
			dataIndex: 'status',
			width: '40%',
			render: renderState
		},
	]

	return (
		<div className={'full-page'}>
			<Row className={'title'}>查看存储池</Row>
			<Row className={'sub-title'}>查看存储池详情</Row>
			<Row type={'flex'} style={{marginTop: '2vh'}}>
				<Descriptions bordered column={2}>
					<Descriptions.Item label="名称">{poolInfo['name']}</Descriptions.Item>
					<Descriptions.Item label="状态">{poolInfo['status']}</Descriptions.Item>
					<Descriptions.Item label="总容量">{poolInfo['volume']}</Descriptions.Item>
					<Descriptions.Item label="可用容量">{poolInfo['available']}</Descriptions.Item>
					<Descriptions.Item label="已用容量">{poolInfo['used']}</Descriptions.Item>
					<Descriptions.Item label="RAID类型">{poolInfo['raid']}</Descriptions.Item>
					<Descriptions.Item label="所包含硬盘">{poolInfo['disks']}</Descriptions.Item>
					<Descriptions.Item label="故障硬盘">{poolInfo['failures']}</Descriptions.Item>
				</Descriptions>
			</Row>
			<Row type={'flex'} className={'body-title'}>最近一次任务</Row>
			{
				isEmpty(scans)?'':(
					<>
						<Row type={'flex'}>
							<Descriptions bordered column={1} style={{width: '400px'}}>
								<Descriptions.Item label="任务">{scans['function']}</Descriptions.Item>
								<Descriptions.Item label="状态">{scans['state']}</Descriptions.Item>
								{
									scans['state']===PoolScanState.Scanning?(
										<Descriptions.Item label="进度">
											<Progress percent={Number(scans['percentage']).toFixed(2)} size="large" status="active"/>
										</Descriptions.Item>
									):''
								}
								<Descriptions.Item label="错误">{scans['errors']}</Descriptions.Item>
								<Descriptions.Item label="日期">{isEmpty(scans['start_time'])?'':moment(scans['start_time']['$date']).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
							</Descriptions>
						</Row>
					</>
				)
			}
			{
				isEmpty(topology['data'])?'':(
					<>
						<Row type={'flex'} className={'body-title'}>
							数据盘（{topology['data'][0]['type']}）
						</Row>
						<Row type={'flex'} style={{width: '600px'}}>
							<Table
								style={{width: '100%'}}
								size={'middle'}
								childrenColumnName={'notallow'}
								pagination={false}
								columns={dataColumns}
								rowKey={(r) => r.id}
								dataSource={topology['data'][0]['children']}
							/>
						</Row>
					</>
				)
			}
			{
				isEmpty(topology['spare'])?'':(
					<>
						<Row type={'flex'} className={'body-title'}>
							热备盘
						</Row>
						<Row type={'flex'} style={{width: '350px'}}>
							<Table
								style={{width: '100%'}}
								size={'middle'}
								childrenColumnName={'notallow'}
								pagination={false}
								columns={columns}
								rowKey={(r) => r.id}
								dataSource={topology['spare']}
							/>
						</Row>
					</>
				)
			}

			{
				isEmpty(topology['cache'])?'':(
					<>
						<Row type={'flex'} className={'body-title'}>
							缓存盘
						</Row>
						<Row type={'flex'} style={{width: '350px'}}>
							<Table
								style={{width: '100%'}}
								size={'middle'}
								childrenColumnName={'notallow'}
								pagination={false}
								columns={columns}
								rowKey={(r) => r.id}
								dataSource={topology['cache']}
							/>
						</Row>
					</>
				)
			}
			<Row style={{height: '50px'}} />

			<Modal
				title={'确认替换硬盘 '+record['disk']}
				open={replace}
				onCancel={onCancel}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={onCancel}>取消</Button>
						<Button type={'primary'} onClick={()=>{form.submit()}} loading={loading}>确认</Button>
					</Row>
				)}
			>
				<Row style={{height: '4vh'}}/>
				<Form
					labelCol={{span: 6,}}
					wrapperCol={{span: 14,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: '100%'}}
					form={form}
					onFinish={confirmReplace}
				>
					<Form.Item label="替换硬盘" name="disk" rules={[{ required: true, message: '请选择硬盘！' }]}>
						<Select
							allowClear
							style={{width: '100%'}}
							placeholder="请选择数据盘"
							options={options}
							disabled={loading}
						/>
					</Form.Item>
					<Form.Item label="进度" name="progress">
						<Progress percent={percent} size="large" status="active"/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}

export default PoolDetails;
