import React, {useEffect, useRef, useState} from 'react';
import { useSearchParams } from "react-router-dom";
import {Row, Col, Descriptions, Modal, notification, Button, Table, Select, Progress} from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { isEmpty, cpy, getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import { renderState, PoolScanFunction, PoolScanState} from "./enum";

let poolSub = null,
	diskSub = null,
	addSub = null;


function PoolEdit() {
	const [search] = useSearchParams();

	const [poolInfo, setPool] = useState({})        // 池数据
	const [box, setBox] = useState([])              // 显示机壳图
	const [title, setTitle] = useState('')          // 弹窗标题
	const [addOpen, setOpen] = useState(false)      // 弹窗open
	const [options, setOption] = useState([])       // 可用磁盘选项
	const [disks, setDisk] = useState([])           // 选择磁盘
	const [percent, setPercent] = useState(0)   // 任务进度
	const [loading, setLoading] = useState(false)   // 按钮loading
	const [disabled, setDisabled] = useState(false) // 选择框disabled

	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('id')) {
				getPoolInfo();
				getUnused();
			}
			else {
				// 数据没有拿到id 跳转错误
			}
		}

		return () => {
			PubSub.unsubscribe(poolSub);
			PubSub.unsubscribe(diskSub);
			PubSub.unsubscribe(addSub);
		}
	}, []);

	// 获取池信息
	const getPoolInfo = () => {
		let uuid = getUUID();
		poolSub = PubSub.subscribe(uuid, (_, data)=>{
			if (!isEmpty(data) && !isEmpty(data[0])) {
				setPool(data[0]);
			}
			else {
				notification.error({message: '存储池信息获取失败'})
			}
		})
		WebSocketService.call(uuid, URL.POOL_QUERY, [[["id", "=", Number(search.get('id'))]]]);
	}

	// 获取可用硬盘 渲染选项及机壳图
	const getUnused = () => {
		const uuid = getUUID();
		diskSub = PubSub.subscribe(uuid, (_, result)=>{
			let temp = [], slotList=[];
			for (let k in result) {
				temp.push({
					label: `${result[k]['name']}（slot-${result[k]['enclosure']['slot']}）`,
					value: result[k]['name']
				})
			}
			if (isEmpty(temp)) {
				notification.warning({message: '暂无可用硬盘'})
			}
			setOption(temp)
			generateBox(1, slotList);
		})
		WebSocketService.call(uuid, URL.DISK_UNUSED);
	}

	// 渲染机壳图
	const generateBox = (boxType, canUse) => {
		let temp = []
		if (boxType === 1) {
			for (let k=1; k<25; k++) {
				if (canUse.includes(Number(k))) {
					temp.push((<Col span={1}><div id={'disk-'+Number(k)} className={'disk-use-item'}>{k}</div></Col>))
				}
				else {
					temp.push((<Col span={1}><div id={'disk-'+Number(k)} className={'disk-disabled-item'}>{k}</div></Col>))
				}
			}
			temp = (<div className={'box-1'}><Row className={'box-1-row'} type={'flex'}>{temp}</Row></div>)
		}
		setBox(temp)
	}

	// addDisk
	const addDisk = title => {
		setTitle(title);
		setOpen(true);
	}

	// confirmAdd
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
		addSub = PubSub.subscribe(uuid, (_, result)=>{
			if (result) {

			}
			else {
				notification.error({message: '磁盘添加失败'});
				setLoading(false);
				setDisabled(false);
			}
		})
		WebSocketService.call(uuid, URL.POOL_UPDATE, params);
	}

	// delDisk

	// onCancel
	const onCancel = () => {
		setOpen(false);
	}

	//
	const columns = [
		{title: '序号', dataIndex: 'index', width: '15%', render: (t,r,i)=>i+1},
		{title: '磁盘', dataIndex: 'disk', width: '30%', render: t => t?t:'N/A'},
		{
			title: '状态',
			dataIndex: 'status',
			width: '30%',
			render: renderState
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '25%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{}}>删除</Button>
					</Row>
				)
			}
		},
	]


	return (
		<div className={'full-page'}>
			<Row className={'title'}>编辑存储池</Row>
			<Row className={'sub-title'}>编辑已有存储池的缓存盘、热备盘</Row>
			<Row type={'flex'} style={{marginTop: '2vh'}}>
				<Descriptions bordered column={2}>
					<Descriptions.Item label="名称">{poolInfo['name']}</Descriptions.Item>
					<Descriptions.Item label="介质类型">{poolInfo['type']}</Descriptions.Item>
					<Descriptions.Item label="数据盘">{isEmpty(poolInfo['topology'])?'':(poolInfo['topology']['data'][0]['children'].map(item=>{return item.disk+'/ '}))}</Descriptions.Item>
					<Descriptions.Item label="RAID级别">{isEmpty(poolInfo['topology'])?'':(poolInfo['topology']['data'][0]['type'])}</Descriptions.Item>
				</Descriptions>
			</Row>
			{
				isEmpty(poolInfo['topology'])?'':(
					<Row type={'flex'} className={'body-title'}>
						缓存盘
						<Button type={'link'} size={'small'} onClick={()=>{addDisk('缓存盘')}}>添加缓存盘</Button>
					</Row>
				)
			}
			{
				isEmpty(poolInfo['topology']) || isEmpty(poolInfo['topology']['cache'])?'暂无缓存盘':(
					<Row type={'flex'} style={{width: '450px'}}>
						<Table
							style={{width: '100%'}}
							size={'middle'}
							childrenColumnName={'notallow'}
							pagination={false}
							columns={columns}
							rowKey={(r) => r.id}
							dataSource={poolInfo['topology']['cache']}
						/>
					</Row>
				)
			}
			{
				isEmpty(poolInfo['topology'])?'':(
					<Row type={'flex'} className={'body-title'}>
						热备盘
						<Button type={'link'} size={'small'} onClick={()=>{addDisk('热备盘')}}>添加热备盘</Button>
					</Row>
				)
			}
			{
				isEmpty(poolInfo['topology']) || isEmpty(poolInfo['topology']['spare'])?'暂无热备盘':(
					<Row type={'flex'} style={{width: '450px'}}>
						<Table
							style={{width: '100%'}}
							size={'middle'}
							childrenColumnName={'notallow'}
							pagination={false}
							columns={columns}
							rowKey={(r) => r.id}
							dataSource={poolInfo['topology']['spare']}
						/>
					</Row>
				)
			}
			<Row type={'flex'} style={{width: '800px', marginTop: '4vh', marginBottom: '30px'}}>{box}</Row>

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
					<Progress percent={percent} size="large" status="active" style={{width: '75%'}}/>
				</Row>
			</Modal>
		</div>
	);
}

export default PoolEdit;
