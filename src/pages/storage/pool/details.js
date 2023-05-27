import React, {useEffect, useRef, useState} from 'react';
import { useSearchParams } from "react-router-dom";
import { Row, Col, Descriptions, Progress, Tag, Modal, notification, Table, Button, Form, Select, Checkbox } from "antd";
import PubSub from "pubsub-js";
import moment from "moment";
import DisksSlot from "../../../component/DiskSlot";
import { URL } from "../../../server/enum";
import { isEmpty, getUUID, getRaid, getVolume, getTime } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import { PoolScanState, renderState, renderDisk } from "./enum";
import BaseTablePage from "../../../component/TablePage";

let poolSub = null, setSub = null, jobSub = null, handleSub = null, diskItemSub = null,
	diskSub = null, replaceSub = null, poolChange = null, scanSub = null,
	addSub = null, addSubProgress = null, delSub = null, delSubProgress = null;


function PoolDetails() {
	const [form] = Form.useForm();
	const [search] = useSearchParams();
	const cRef = useRef(null)

	const [poolInfo, setPool] = useState({})        // 池数据
	const [poolType, setPoolType] = useState('')        // 池数据
	const [dataDisk, setData] = useState([])        // 数据盘
	const [topology, setTopology] = useState({})    // topology数据 所有盘使用情况
	const [percent, setPercent] = useState(0)       // 替换进度
	const [replace, setReplace] = useState(false)   // 替换进度Modal窗
	const [record, setRecord] = useState({})        // 要调换的record
	const [idleDisks, setIdleDisks] = useState([])  // 所有可用硬盘
	const [options, setOption] = useState([])       // 硬盘选项 包括添加 替换
	const [loading, setLoading] = useState(false)   // 替换过程中按钮的loading
	const [scans, setScan] = useState({})           // 显示scan任务
	const [title, setTitle] = useState('')          // 弹窗标题
	const [addOpen, setAddOpen] = useState(false)   // 添加硬盘 弹窗open
	const [addPercent, setAddPercent] = useState(0) // 添加硬盘 添加进度
	const [disks, setDisk] = useState([])           // 选择添加的磁盘
	const [disabled, setDisabled] = useState(false) // 添加窗口选择框disabled
	const [delOpen, setDelOpen] = useState(false)   // 删除硬盘弹窗open


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
			PubSub.unsubscribe(addSub);PubSub.unsubscribe(addSubProgress);PubSub.unsubscribe(delSub);PubSub.unsubscribe(delSubProgress);
			PubSub.unsubscribe(diskItemSub);
		}
	}, []);

	// 页面所有需要获取的数据
	const getAllData = () => {
		getPoolInfo(true);
		getUnusedDisk();
	}

	// 刷新机箱槽位图
	const refreshSlot = () => {
		cRef.current.refresh();
	}

	// 获取可用硬盘 生成options 用于硬盘替换
	const getUnusedDisk = () => {
		let uuid = getUUID();
		diskSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = []
			if (result.length>0) temp = result
			setIdleDisks(temp);
		})
		WebSocketService.call(uuid, URL.DISK_UNUSED);
	}

	// 获取池信息
	const getPoolInfo = (flag=false) => {
		let uuid = getUUID();
		poolSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (!isEmpty(result) && !isEmpty(result[0])) {
				getDatasetInfo(result[0]);
				if (flag) {
					// 首次获取池信息时
					// 开启所有上报监听
					startSub(result[0]);
					// 根据数据盘判断存储池介质类型
					getPoolType(result[0])
				}
			}
			else {
				notification.error({message: '存储池信息获取失败'})
			}
		})
		WebSocketService.call(uuid, URL.POOL_QUERY, [[["id", "=", Number(search.get('id'))]]]);
	}

	// 判断并保存 存储池介质类型
	const getPoolType = pool => {
		let temp = ''
		if (pool['topology']['data'][0]['type'] === 'DISK') {
			if (pool['topology']['data'][0]['type'] === 'SPARE') {
				temp = pool['topology']['data'][0]['children'][0]['disk']
			}
			else {
				temp = pool['topology']['data'][0]['disk']
			}
		}
		else {
			if (pool['topology']['data'][0]['children'][0]['type'] === 'SPARE') {
				temp = pool['topology']['data'][0]['children'][0]['children'][0]['disk']
			}
			else {
				temp = pool['topology']['data'][0]['children'][0]['disk']
			}
		}

		PubSub.unsubscribe(diskItemSub);
		let uuid = getUUID();
		diskItemSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取败失，请稍后重试'})
			}
			else {
				setPoolType(result[0]['type'])
			}
		})
		WebSocketService.call(uuid, URL.DISK_QUERY, [[['name', '=', temp]]]);
	}

	// 获取数据集信息 用于展示容量
	const getDatasetInfo = data => {
		let uuid = getUUID();
		setSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (!isEmpty(result) && !isEmpty(result[0])) {
				generateData(data, result[0]);
			}
			else {
				notification.error({message: '存储池信息获取失败'})
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[["id", "=", data['name']]]]);
	}

	// 开启各种任务进度监听
	const startSub = r => {
		// 替换硬盘任务
		replaceSub = PubSub.subscribe('pool.replace-'+r['id'], (_, {result})=>{
			setPercent(result['progress']['percent']);
			if (result['state'] === 'SUCCESS') {
				notification.success({message: '硬盘替换完成，等待数据同步'});
			}
			else if (result['state'] === 'FAILED') {
				setLoading(false);
				Modal.error({
					title: '替换失败',
					content: result['error']
				})
				onCancel();
			}
		})
		// 添加磁盘任务
		addSubProgress = PubSub.subscribe('pool.update-'+r['id'], (_, {result})=>{
			setAddPercent(result['progress']['percent']);
			if (result['state'] === 'SUCCESS') {
				notification.success({message: `添加${title}完成，等待数据同步`});
			}
			else if (result['state'] === 'FAILED') {
				setLoading(false);
				setDisabled(false);
				Modal.error({
					title: '添加失败',
					content: result['error']
				})
				onCancel();
			}
		})
		// 删除磁盘任务
		delSubProgress = PubSub.subscribe('pool.remove-'+r['id'], (_, {result})=>{
			setPercent(result['progress']['percent']);
			if (result['state'] === 'SUCCESS') {
				notification.success({message: '删除完成'});
				setLoading(false);
				setDelOpen(false);
				setPercent(0);
				getPoolInfo(false);
				getUnusedDisk();
				refreshSlot();
			}
			else if (result['state'] === 'FAILED') {
				setLoading(false);
				setDisabled(false);
				Modal.error({
					title: '删除失败',
					content: result['error']
				})
				onCancel();
			}
		})
		// scanSub
		scanSub = PubSub.subscribe('zfs.pool.scan-'+r['name'], (_, {result})=>{
			setScan(result)
		})
		// 接收到新的池数据推送 认为操作成功
		poolChange = PubSub.subscribe('pool.query-'+r['id'], (_, {result})=>{
			form.setFieldsValue({disk: undefined, force: undefined})
			setPercent(0);
			setAddPercent(0);
			setLoading(false);
			setReplace(false);
			setDisabled(false);
			setAddOpen(false);
			setDisk([]);
			getDatasetInfo(result);
			getUnusedDisk();
			refreshSlot();
		})
	}

	// 数据整理 用于显示
	const generateData = (pool, dataset) => {
		let temp = {}, dataTemp = []
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
		temp['raid'] = getRaid(pool['topology'])
		temp['disks'] = ''
		temp['failures'] = ''
		if (pool['topology']['data'][0]['type'] === 'DISK') {
			for (let k in pool['topology']['data']) {
				if (pool['topology']['data'][k]['children'].length===0) delete pool['topology']['data'][k]['children']
				dataTemp.push(pool['topology']['data'][k]);
				if (pool['topology']['data'][k]['type'] === 'SPARE') {
					temp['disks'] += pool['topology']['data'][k]['children'][0]['disk']+'(热备)、'
				}
				else {
					temp['disks'] += pool['topology']['data'][k]['disk']+'、'
				}
				if (pool['topology']['data'][k]['status'] !== 'ONLINE') {
					if (pool['topology']['data'][k]['type'] === 'SPARE') {
						for (let n in pool['topology']['data'][k]['children']) {
							if (pool['topology']['data'][k]['children'][n]['status'] !== 'ONLINE') {
								temp['failures']+= pool['topology']['data'][k]['children'][n]['disk']+'、'
							}
						}
					}
					else {
						temp['failures']+= pool['topology']['data'][k]['disk']+'、'
					}
				}
			}
		}
		else {
			for (let k in pool['topology']['data']) {
				for (let m in pool['topology']['data'][k]['children']) {
					if (pool['topology']['data'][k]['children'][m]['children'].length===0) delete pool['topology']['data'][k]['children'][m]['children']
					dataTemp.push(pool['topology']['data'][k]['children'][m]);
					if (pool['topology']['data'][k]['children'][m]['type'] === 'SPARE') {
						temp['disks'] += pool['topology']['data'][k]['children'][m]['children'][0]['disk']+'(热备)、'
					}
					else {
						temp['disks'] += pool['topology']['data'][k]['children'][m]['disk']+'、'
					}
					if (pool['topology']['data'][k]['children'][m]['status'] !== 'ONLINE') {
						if (pool['topology']['data'][k]['children'][m]['type'] === 'SPARE') {
							for (let n in pool['topology']['data'][k]['children'][m]['children']) {
								if (pool['topology']['data'][k]['children'][m]['children'][n]['status'] !== 'ONLINE') {
									temp['failures']+= pool['topology']['data'][k]['children'][m]['children'][n]['disk']+'、'
								}
							}
						}
						else {
							temp['failures']+= pool['topology']['data'][k]['children'][m]['disk']+'、'
						}
					}
				}
			}
		}
		for (let k in pool['topology']['cache']) {
			if (!isEmpty(pool['topology']['cache'][k]['disk'])) {
				temp['disks'] +=pool['topology']['cache'][k]['disk']+'、'
				if (pool['topology']['cache'][k]['status'] !== 'ONLINE') {
					temp['failures']+=pool['topology']['cache'][k]['disk']+'、'
				}
			}
		}
		for (let k in pool['topology']['spare']) {
			if (!isEmpty(pool['topology']['spare'][k]['disk'])) {
				temp['disks'] +=pool['topology']['spare'][k]['disk']+'、'
			}
		}
		setScan(pool['scan'])
		setTopology(pool['topology']);
		setPool(temp);
		setData(dataTemp);
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
						handleSub = PubSub.subscribe(uuid, (_, {result, error})=>{
							resolve()
							if (result) {
								getPoolInfo(false);
								getUnusedDisk();
								refreshSlot();
							}
							else if (error) {
								Modal.error({title: '操作错误', content: error.reason})
							}
						})
						WebSocketService.call(uuid, handleUrl[type], [poolInfo['id'], {label: r['guid']}]);
					}).catch(() => console.error('Oops errors!'));
				}
			})
		}
	}

	// 替换硬盘
	const replaceDisk = r => {
		if (loading || disabled) {
			notification.warning({message: '存储池有任务进行中'});
			return ;
		}
		if (r['type'] === 'REPLACING') {
			notification.warning({message: '磁盘正在替换中'});
			return ;
		}
		getReplaceInfo(r)
	}

	// 获取被替换盘基本信息
	const getReplaceInfo = r => {
		PubSub.unsubscribe(diskItemSub);
		let uuid = getUUID();
		diskItemSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取败失，请稍后重试'})
			}
			else {
				let temp = []
				for (let k in idleDisks) {
					if (idleDisks[k]['type'] === result[0]['type'] && idleDisks[k]['size']>=result[0]['size']) {
						temp.push({
							label: `${idleDisks[k]['name']}（${idleDisks[k]['type']}, ${getVolume(idleDisks[k]['size'], 2)}）`,
							value: idleDisks[k]['identifier']
						})
					}
				}
				if (temp.length === 0) {
					notification.warning({message: '暂无满足需求的可用硬盘'});
				}
				setOption(temp);
				setRecord(r)
				setReplace(true)
			}
		})
		WebSocketService.call(uuid, URL.DISK_QUERY, [[['name', '=', r['disk']]]]);
	}

	// 确认替换
	const confirmReplace = values => {
		setLoading(true);
		let uuid = getUUID();
		let force = false;
		if (values['force']) force = true;
			handleSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (result) {

			}
			else if (error) {
				setLoading(false);
				notification.error({message: '替换失败'})
				setReplace(false)
			}
		})
		WebSocketService.call(uuid, URL.POOL_REPLACE, [poolInfo['id'], {label: record['guid'], disk: values['disk'], force}]);
	}

	// 添加硬盘 addDisk
	const addDisk = title => {
		if (loading || disabled) {
			notification.warning({message: '存储池有任务进行中'});
			return ;
		}
		if (title === '缓存盘') {
			if (poolType === 'SSD') {
				notification.warning({message: '该存储池介质类型为SSD，无需添加缓存盘'});
				return ;
			}
			let temp = []
			for (let k in idleDisks) {
				if (idleDisks[k]['type'] === 'SSD') {
					temp.push({
						label: `${idleDisks[k]['name']}（${idleDisks[k]['type']}, ${getVolume(idleDisks[k]['size'], 2)}）`,
						value: idleDisks[k]['identifier']
					})
				}
			}
			if (temp.length === 0) {
				notification.warning({message: '暂无满足需求的可用硬盘'});
			}
			setOption(temp);
		}
		else if (title === '热备盘') {
			let temp = []
			for (let k in idleDisks) {
				if (idleDisks[k]['type'] === poolType) {
					temp.push({
						label: `${idleDisks[k]['name']}（${idleDisks[k]['type']}, ${getVolume(idleDisks[k]['size'], 2)}）`,
						value: idleDisks[k]['identifier']
					})
				}
			}
			if (temp.length === 0) {
				notification.warning({message: '暂无满足需求的可用硬盘'});
			}
			setOption(temp);
		}
		setTitle(title);
		setAddOpen(true);
	}

	// 确认添加
	const confirmAdd = () => {
		let params = [];
		if (title === '热备盘') {
			params = [poolInfo['id'], {topology: {spares: disks}}]
		}
		else if (title === '缓存盘') {
			params = [poolInfo['id'], {topology: {cache: [{type: "STRIPE", disks}]}}]
		}

		let uuid = getUUID();
		setLoading(true);
		setDisabled(true);
		addSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				notification.error({message: '磁盘添加失败'});
				setLoading(false);
				setDisabled(false);
			}
		})
		WebSocketService.call(uuid, URL.POOL_UPDATE, params);
	}

	// 删除硬盘
	const delDisk = r => {
		if (loading || disabled) {
			notification.warning({message: '存储池有任务进行中'});
			return ;
		}
		setRecord(r)
		setDelOpen(true);
	}

	// 确认删除
	const confirmDel = () => {
		let uuid = getUUID();
		setLoading(true);
		delSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				notification.error({message: '磁盘删除失败'});
				setLoading(false);
				setDisabled(false);
				setPercent(0);
			}
		})
		WebSocketService.call(uuid, URL.POOL_REMOVE, [poolInfo['id'], {label: record['guid']}]);
	}

	// 关闭弹窗
	const onCancel = () => {
		form.setFieldsValue({disk: undefined, force: undefined})
		setReplace(false)
		setAddOpen(false);
		setDelOpen(false);
		setPercent(0);
	}


	// columns
	const dataColumns = [
		{title: '序号', dataIndex: 'index', width: '15%', render: (t,r,i)=>{
			if (r['type'] === 'SPARE') return (i+1)
				return i+1
			}},
		{title: '磁盘', dataIndex: 'disk', width: '22%', render: renderDisk},
		{
			title: '状态',
			dataIndex: 'status',
			width: '20%',
			render: renderState
		},
		{
			title: '操作',
			dataIndex: 'type',
			width: '43%',
			render: (t, r)=>{
				if (t === 'SPARE') {
					return ''
				}
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
		{title: '序号', dataIndex: 'index', width: '15%', render: (t,r,i)=>i+1},
		{title: '磁盘', dataIndex: 'disk', width: '25%', render: t => t?t:'N/A'},
		{
			title: '状态',
			dataIndex: 'status',
			width: '25%',
			render: (t, r) => {
				if (r['disk']) renderState(t, r)
				else return ''
			}
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '35%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{delDisk(r)}}>删除</Button>
					</Row>
				)
			}
		},
	]

	return (
		<div className={'full-page'}>
			<Row className={'title'}>查看存储池</Row>
			<Row className={'sub-title'}>查看存储池详情</Row>
			<Row type={'flex'} style={{marginTop: '2vh'}}>
				<Col span={13}>
					<Row type={'flex'} className={'body-title'}>存储池详情</Row>
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
				</Col>
				<Col span={1}/>
				<Col span={9}>
					<Row type={'flex'} className={'body-title'}>最近一次任务</Row>
					{
						isEmpty(scans)?'':(
							<>
								<Row type={'flex'}>
									<Descriptions bordered column={2}>
										<Descriptions.Item label="任务">{scans['function']}</Descriptions.Item>
										<Descriptions.Item label="状态">{scans['state']}</Descriptions.Item>
										{
											scans['state']===PoolScanState.Scanning?(
												<Descriptions.Item label="进度" span={2}>
													<Progress percent={Number(scans['percentage']).toFixed(2)} size="large" status="active"/>
												</Descriptions.Item>
											):''
										}
										{
											scans['total_secs_left'] && scans['total_secs_left']>0?(
												<Descriptions.Item label="预计剩余" span={2}>
													{getTime(scans['total_secs_left'])}
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
				</Col>
			</Row>
			<Row type={'flex'} style={{marginTop: '3vh'}}>
				<Col span={8} style={{paddingRight: '1vw'}}>
					{
						isEmpty(topology['data'])?'':(
							<>
								<Row type={'flex'} className={'body-title'}>
									数据盘（{getRaid(topology)}）
								</Row>
								<Row type={'flex'}>
									<Table
										style={{width: '100%'}}
										size={'middle'}
										defaultExpandAllRows={true}
										pagination={false}
										columns={dataColumns}
										rowKey={(r) => r.id}
										dataSource={dataDisk}
									/>
								</Row>
							</>
						)
					}
				</Col>
				<Col span={8} style={{paddingRight: '1vw'}}>
					<Row type={'flex'} className={'body-title'}>
						缓存盘
						<Button type={'link'} size={'small'} onClick={()=>{addDisk('缓存盘')}}>添加缓存盘</Button>
					</Row>
					<Row type={'flex'}>
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
				</Col>
				<Col span={8} style={{paddingRight: '1vw'}}>
					<Row type={'flex'} className={'body-title'}>
						热备盘
						<Button type={'link'} size={'small'} onClick={()=>{addDisk('热备盘')}}>添加热备盘</Button>
					</Row>
					<Row type={'flex'}>
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
				</Col>
			</Row>
			<Row type={'flex'} style={{marginBottom: '30px'}}>
				<DisksSlot ref={cRef}/>
			</Row>

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
					wrapperCol={{span: 15,}}
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
					<Form.Item label="强制" name="force" valuePropName={'checked'} tooltip={'设置为覆盖安全检查并将磁盘添加到池中。警告：磁盘上存储的所有数据都将被清除！'}>
						<Checkbox />
					</Form.Item>
					<Form.Item label="进度" name="progress">
						<Progress percent={percent} size="large" status="active"/>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				maskClosable={false}
				title={'添加'+title}
				open={addOpen}
				onCancel={onCancel}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={onCancel}>取消</Button>
						<Button type={'primary'} loading={loading} onClick={confirmAdd}>确定</Button>
					</Row>
				)}
			>
				<Row type={'flex'} align={'middle'} style={{marginTop: '3vh'}}>
					选择硬盘：
					<Select
						mode="multiple"
						allowClear
						style={{width: '75%'}}
						placeholder="请选择硬盘"
						options={options}
						value={disks}
						disabled={disabled}
						onChange={value=>setDisk(value)}
					/>
				</Row>
				<Row type={'flex'} align={'middle'} style={{marginTop: '3vh'}}>
					&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;进度：
					<Progress percent={addPercent} size="large" status="active" style={{width: '75%'}}/>
				</Row>
			</Modal>

			<Modal
				maskClosable={false}
				title={'确认删除'}
				open={delOpen}
				onCancel={onCancel}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={onCancel}>取消</Button>
						<Button type={'primary'} loading={loading} onClick={confirmDel}>确定</Button>
					</Row>
				)}
			>
				<Row style={{marginTop: '3vh'}}>确认删除硬盘 {record['disk']}</Row>
				<Row type={'flex'} align={'middle'} style={{marginTop: '1vh'}}>
					&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;进度：
					<Progress percent={percent} size="large" status="active" style={{width: '75%'}}/>
				</Row>
			</Modal>
		</div>
	);
}

export default PoolDetails;
