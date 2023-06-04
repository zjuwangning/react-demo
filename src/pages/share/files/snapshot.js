import React, { useEffect, useState } from 'react';
import {useNavigate, useSearchParams} from "react-router-dom";
import { Row, Col, Modal, notification, Button, Table, Input, Radio, Space } from "antd";
import PubSub from "pubsub-js";
import moment from "moment";
import { URL } from "../../../server/enum";
import { isEmpty, getUUID, tailFormItemLayout } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let snapshotSub = null,
	createSub = null,
	rollSub = null,
	cloneSub = null,
	delSub = null;


function Snapshot() {
	const navigate = useNavigate();
	const [search] = useSearchParams();

	const [snapshotList, setSnapshot] = useState([]);
	const [record, setRecord] = useState([]);
	const [loading, setLoading] = useState(false);
	const [btnLoading, setBtn] = useState(false);
	const [opened, setOpen] = useState(false);
	const [openRollback, setRollback] = useState(false);
	const [openExport, setExport] = useState(false);
	const [snapshotName, setName] = useState('');
	const [dstName, setDst] = useState('');
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 10,
		},
	});
	const [radioValue, setValue] = useState(0);


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('id')) {
				getData();
			}
			else {
				// 数据没有拿到id 跳转错误
			}
		}

		return () => {
			PubSub.unsubscribe(snapshotSub);
			PubSub.unsubscribe(createSub);
			PubSub.unsubscribe(rollSub);
			PubSub.unsubscribe(cloneSub);
			PubSub.unsubscribe(delSub);
		}
	}, []);

	// 获取快照列表
	const getData = () => {
		setLoading(true);
		let uuid = getUUID();
		snapshotSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
				setLoading(false);
			}
			else {
				result = result.sort((a, b)=>{return b['properties']['creation']['parsed']['$date'] - a['properties']['creation']['parsed']['$date']})
				setSnapshot(result);
				setLoading(false);
			}
		})
		WebSocketService.call(uuid, URL.SNAPSHOT_QUERY, [[["dataset", "=", search.get('id')]]]);
	}

	//
	const confirmCreate = () => {
		let uuid = getUUID();
		let params = {name: snapshotName, dataset: search.get('id')}
		if (isEmpty(snapshotName)) params = {name: `manual-${moment().format('YYYY-MM-DD_HH-mm')}`, dataset: search.get('id')}
		setBtn(true);
		createSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				notification.error({message: '快照创建失败，请稍后重试'})
				setBtn(false);
				setOpen(false);
			}
			else {
				notification.success({message: '创建快照成功'});
				setBtn(false);
				setOpen(false);
				getData();
			}
		})
		WebSocketService.call(uuid, URL.SNAPSHOT_CREATE, [params]);
	}

	//
	const onDelete = r => {
		Modal.confirm({
			title: '确认操作',
			content: '是否确认删除快照 '+r['snapshot_name'],
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					delSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: '删除失败'});
						}
						else {
							notification.success({message: '删除成功'});
							getData();
						}
					})
					WebSocketService.call(uuid, URL.SNAPSHOT_DELETE, [r['id']]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	//
	const onRollback = r => {
		setRecord(r);
		setValue(0);
		setRollback(true);
	}

	//
	const confirmRollback = () => {
		let uuid = getUUID();
		let params = {recursive: false, force: true}
		if (radioValue===1) params = {recursive: true, force: true}
		setBtn(true);
		rollSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				notification.error({message: '快照回滚失败，请稍后重试'})
				setBtn(false);
				setRollback(false);
				Modal.error({
					title: '回滚错误',
					content: error.reason
				})
			}
			else {
				notification.success({message: '快照回滚成功'});
				setBtn(false);
				setRollback(false);
				getData();
			}
		})
		WebSocketService.call(uuid, URL.SNAPSHOT_ROLLBACK, [record['id'], params]);
	}

	//
	const onExport = r => {
		setRecord(r);
		setDst(`${r['dataset'].slice(r['pool'].length+1)}-manual-${moment().format('YYYY-MM-DD_HH-mm')}-clone`);
		setExport(true)
	}

	// confirm
	const confirmExport = () => {
		let uuid = getUUID();
		let params = {dataset_dst: record['pool']+'/'+dstName, snapshot: record['id']}
		if (isEmpty(dstName)) params['dataset_dst'] = `${record['dataset']}-manual-${moment().format('YYYY-MM-DD_HH-mm')}-clone`
		setBtn(true);
		cloneSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				notification.error({message: '快照导出失败，请稍后重试'})
				setBtn(false);
				setOpen(false);
			}
			else {
				notification.success({message: '创建导出成功'});
				setBtn(false);
				setOpen(false);
				navigate('/share/files');
			}
		})
		WebSocketService.call(uuid, URL.SNAPSHOT_CLONE, [params]);
	}

	//
	const handleTableChange = (pagination, filters, sorter) => {
		if (pagination.pageSize !== tableParams.pagination?.pageSize) {
			pagination.current = 1;
		}
		setTableParams({
			pagination,
			filters,
			...sorter,
		});
	};

	//
	const oncancel = () => {
		setOpen(false);
		setRollback(false);
		setExport(false);
	}

	//
	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '5%',
			render: (t,r,i)=>i+1
		},
		{
			title: '目录名称',
			dataIndex: 'dataset',
			width: '19%'
		},
		{
			title: '快照名称',
			dataIndex: 'snapshot_name',
			width: '23%'
		},
		{
			title: '大小',
			dataIndex: 'properties',
			width: '12%',
			render: t=> t?t.used.value:''
		},
		{
			title: '创建日期',
			dataIndex: 'properties',
			width: '22%',
			render: t => {
				if (t && t['creation'] && t['creation']['parsed']) {
					return moment.unix(t['creation']['rawvalue']).format('YYYY-MM-DD HH:mm:ss')
				}
			}
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '19%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{onDelete(r)}}>删除</Button>
						<Button type={'link'} size={'small'} onClick={()=>{onRollback(r)}}>回滚</Button>
						<Button type={'link'} size={'small'} onClick={()=>{onExport(r)}}>导出</Button>
					</Row>
				)
			}
		},
	]

	return (
		<div className={'full-page'}>
			<Row className={'title'}>快照</Row>
			<Row className={'sub-title'}>查看，创建，删除和导出当前共享文件的快照</Row>
			<Row className={'actions'}>
				<Button type={'primary'} onClick={()=>{
					setOpen(true)
					setName(`manual-${moment().format('YYYY-MM-DD_HH-mm')}`)
				}}>创建手动快照</Button>
			</Row>
			<Table
				size={'middle'}
				style={{width: '100%', minWidth: 1000}}
				columns={columns}
				rowKey={(record) => record.id || record.serial}
				dataSource={snapshotList}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				// childrenColumnName={'notallow'}
			/>

			<Modal
				title={`${search.get('id')} 创建手动快照`}
				open={opened}
				onCancel={oncancel}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={oncancel}>取消</Button>
						<Button type={'primary'} onClick={confirmCreate} loading={btnLoading}>确定</Button>
					</Row>
				)}
			>
				<Row type={'flex'} align={'middle'} style={{marginTop: '3vh', marginBottom: '2vh'}}>
					<Col span={5}><Row type={'flex'} justify={'end'}>快照名称：</Row></Col>
					<Col span={18}>
						<Input value={snapshotName} onChange={e=>setName(e.target.value)}/>
					</Col>
				</Row>
			</Modal>

			<Modal
				title={`快照回滚`}
				width={600}
				open={openRollback}
				onCancel={oncancel}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={oncancel}>取消</Button>
						<Button type={'primary'} onClick={confirmRollback} loading={btnLoading}>确定</Button>
					</Row>
				)}
			>
				{
					isEmpty(record)?'':(
						<Row style={{marginBottom: '30px'}}>{`使用快照 ${record['snapshot_name']} 将 ${record['dataset']} 回滚到 ${moment.unix(record['properties']['creation']['rawvalue']).format('YYYY-MM-DD HH:mm:ss')}`}</Row>
					)
				}
				<Radio.Group value={radioValue} onChange={e=>setValue(e.target.value)}>
					<Space direction="vertical">
						<Radio value={0}>存在较新快照时，停止回滚</Radio>
						<Radio value={1}>不进行安全检查</Radio>
					</Space>
				</Radio.Group>
				<Row style={{marginTop: '5px'}}>不进行安全检查回滚将销毁比回滚快照新的其他快照。</Row>
				<Row style={{marginTop: '30px'}}>警告：向后滚动数据集会破坏数据集上的数据，并且会破坏与数据集相关的其他快照。 这可能会导致永久性的数据丢失！在备份所有需要的数据和快照之前，请不要回滚。</Row>
			</Modal>

			<Modal
				title={'导出到新的共享文件'}
				open={openExport}
				onCancel={oncancel}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={oncancel}>取消</Button>
						<Button type={'primary'} onClick={confirmExport} loading={btnLoading}>确定</Button>
					</Row>
				)}
			>
				<Row type={'flex'} align={'middle'} style={{marginTop: '3vh', marginBottom: '2vh'}}>
					<Col span={5}><Row type={'flex'} justify={'end'}>数据池：</Row></Col>
					<Col span={18}>
						{isEmpty(record)?'':record['pool']}
					</Col>
				</Row>
				<Row type={'flex'} align={'middle'} style={{marginTop: '3vh', marginBottom: '2vh'}}>
					<Col span={5}><Row type={'flex'} justify={'end'}>文件名称：</Row></Col>
					<Col span={18}>
						<Input value={dstName} onChange={e=>setDst(e.target.value)}/>
					</Col>
				</Row>
			</Modal>
		</div>
	);
}

export default Snapshot;
