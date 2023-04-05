import React, {useEffect, useRef, useState} from 'react';
import { useNavigate } from "react-router-dom";
import {Row, Col, Button, Progress, Tag, Modal, Checkbox, notification, Table} from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import BaseTablePage from "../../../component/TablePage";
import { isEmpty, cpy, getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let attachSub = null,
	poolSub = null,
	datasetSub = null,
	delSub = null,
	delProgressSub = null;

let dataset = [], poolInfo = null;

function Pool() {
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 存储池列表
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 10,
		},
	});
	const [loading, setLoading] = useState(false);


	const [record, setRecord] = useState({})
	const [visible, setVisible] = useState(false)
	const [deleting, setDelVisible] = useState(false)
	const [confirmed, setConfirm] = useState(false)
	const [params, setParams] = useState({destroy: false, cascade: true})
	const [attach, setAttach] = useState([])
	const [percent, setPercent] = useState(0)   // 删除进度

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();

		return () => {
			PubSub.unsubscribe(attachSub);
			PubSub.unsubscribe(delSub);
			PubSub.unsubscribe(poolSub);
			PubSub.unsubscribe(datasetSub);
			PubSub.unsubscribe(delProgressSub);
		}
	}, []);

	// 获取所有存储池 及 数据集内存使用情况
	const getData = () => {
		setLoading(true);
		dataset = [];
		poolInfo = null;

		let uuid = getUUID();
		poolSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
				setLoading(false);
				setData([]);
			}
			else {
				if (!isEmpty(dataset)) {
					generateData(dataset, result);
				}
				else {
					poolInfo = result
				}
			}
		})
		WebSocketService.call(uuid, URL.POOL_QUERY);

		uuid = getUUID();
		datasetSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
				setLoading(false);
				setData([]);
			}
			else {
				if (!isEmpty(poolInfo)) {
					generateData(result, poolInfo);
				}
				else {
					dataset = result
				}
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[], {extra: {properties: ['used', 'available']}}]);
	}

	// 表格数据重组
	const generateData = (set, pool) => {
		for (let k in pool) {
			for (let m in set) {
				if (set[m]['id']+'' === pool[k]['name']) {
					pool[k]['used'] = set[m]['used']
					pool[k]['available'] = set[m]['available']
				}
			}
		}
		setLoading(false);
		setData(pool);
	}

	// 确认删除
	const confirmDel = () => {
		if (WebSocketService) {
			let uuid = getUUID();
			delSub = PubSub.subscribe(uuid, (_, {result})=>{
				if (!isEmpty(result)) {
					setVisible(false);
					setDelVisible(true);
					delProgressSub = PubSub.subscribe('pool.export-'+record['id'], (_, {result}) => {
						setPercent(result['progress']['percent'])
						if (result['state'] === 'SUCCESS') {
							notification.success({message: '删除存储池完成'});
							onCancel();
							getData();
						}
						else if (result['state'] === 'FAILED') {
							notification.success({message: '删除存储池失败'});
							onCancel();
						}
					})
				}
			})
			WebSocketService.call(uuid, URL.POOL_EXPORT, [record['id'], params]);
		}
	}

	const deletePool = r => {
		setVisible(true);
		setRecord(r)

		if (WebSocketService) {
			let uuid = getUUID();
			attachSub = PubSub.subscribe(uuid, (_, {result})=>{
				setAttach(result);
			})
			WebSocketService.call(uuid, URL.POOL_ATTACH, [r['id']]);
		}
	}

	const onCancel = () => {
		setRecord({});
		setConfirm(false);
		setParams({destroy: false, cascade: true});
		setAttach([]);
		setPercent(0);

		setVisible(false);
		setDelVisible(false);
	}

	const onDataChange = (key, value) => {
		let temp = cpy(params)
		temp[key] = value;
		setParams(temp)
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
			title: '名称',
			dataIndex: 'name',
			width: '9%'
		},
		{
			title: '状态',
			dataIndex: 'status',
			width: '11%',
			render: t => {
				let color = 'red'
				if (t === 'ONLINE') color='green'
				else if (t === 'DEGRADED') color='orange'
				return <Tag color={color}>{t}</Tag>
			}
		},
		{
			title: '容量',
			dataIndex: 'used',
			width: '48%',
			render: (t, r) => {
				let percent = 0
				if (!isEmpty(r['used']['parsed']) && !isEmpty(r['available']['parsed'])) {
					percent = r['used']['parsed']/(r['used']['parsed']+r['available']['parsed'])
					percent = (Number(percent)*100).toFixed(0)
				}
				return (
					<Row type={'flex'}>
						<Col span={12}>
							<Progress percent={percent} size="large" showInfo={false}/>
						</Col>
						<Col span={1}/>
						<Col span={11}>
							{r['used']['value']} 已使用（{percent}%）丨
							{r['available']['value']} 空闲
						</Col>
					</Row>
				)
			}
		},
		{
			title: 'RAID类型',
			dataIndex: 'topology',
			width: '10%',
			render: t => {
				if (!isEmpty(t) && !isEmpty(t['data'])) {
					return t['data'][0]['type']
				}
			}
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '17%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/storage/pools/details?id='+r['id'])}}>详情</Button>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/storage/pools/scrub?id='+r['id'])}}>校验</Button>
						<Button type={'link'} size={'small'} onClick={()=>{deletePool(r)}}>删除</Button>
					</Row>
				)
			}
		},
	];

	const actions = <Button type={'primary'} onClick={()=>{navigate('/storage/pools/create')}}>新建</Button>


	return (
		<div className={'full-page'}>
			<Row className={'title'}>存储池列表</Row>
			<Row className={'sub-title'}>显示所有磁盘池的摘要，删除或者定位特定磁盘池。</Row>
			<Row className={'actions'}>{actions}</Row>
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
			{/*<BaseTablePage*/}
			{/*	ref={cRef}*/}
			{/*	title={'存储池列表'}*/}
			{/*	subTitle={'显示所有磁盘池的摘要，删除或者定位特定磁盘池。'}*/}
			{/*	url={[URL.POOL_QUERY, URL.DATASET_QUERY]}*/}
			{/*	match={['name', 'id']}*/}
			{/*	merge={['used', 'available']}*/}
			{/*	columns={columns}*/}
			{/*	actions={actions}*/}
			{/*	// filters={filters}*/}
			{/*/>*/}
			<Modal
				title={'删除池 '+record['name']}
				open={visible}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button type={'primary'} disabled={!confirmed} onClick={confirmDel}>删除</Button>
						<Button style={{marginLeft: '10px'}} onClick={onCancel}>取消</Button>
					</Row>
				)}
				onCancel={onCancel}
			>
				<Row>删除后，池中的数据将不可用。可以通过设置销毁池数据选项来销毁池磁盘上的数据。在删除池之前备份关键数据。</Row>
				{
					attach.length>0?(
						<div style={{marginTop: '40px'}}>
							<Row>下列服务依赖于池 {record['name']}，如果池被删除，将会中断：</Row>
							{
								attach.map(item=>{
									return (
										<div>
											<Row>{item['type']}：</Row>
											{item['attachments'].map(item=>{return (<Row>- {item}</Row>)})}
										</div>
									)
								})
							}
						</div>
					):''
				}
				<Row style={{marginTop: '45px'}}><Checkbox checked={params['destroy']} onChange={e=>onDataChange('destroy', e.target.checked)}>销毁池数据</Checkbox></Row>
				<Row style={{marginTop: '20px'}}><Checkbox checked={params['cascade']} onChange={e=>onDataChange('cascade', e.target.checked)}>删除共享配置</Checkbox></Row>
				<Row style={{marginTop: '20px'}}><Checkbox checked={confirmed} onChange={e=>{setConfirm(e.target.checked)}}>确认删除</Checkbox></Row>
			</Modal>

			<Modal
				title={record['name']+' 删除中...'}
				open={deleting}
				onCancel={onCancel}
				footer={(<Row type={'flex'} justify={'end'}><Button onClick={onCancel}>关闭窗口</Button></Row>)}
			>
				<Row type={'flex'} align={'middle'} style={{marginTop: '30px'}}>
					进度： <Col span={18}><Progress percent={percent} size="small" status="active" /></Col>
				</Row>
			</Modal>
		</div>
	);
}

export default Pool;
