import React, {useEffect, useRef, useState} from 'react';
import { useNavigate } from "react-router-dom";
import {Row, Button, notification, Modal, Select, Tooltip, Table, Tabs} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID, isEmpty, getVolume } from "../../../utils/cmn";
import {WebSocketService} from "../../../server";
import Cache from "../../../utils/Cache";
import { esp } from '../../../component/DiskSlot/enum'

let timer = null,
	fetchSub = null,        // 获取硬盘数据
	locateConfirmSub = null,        // 发送定位
	locateCancelSub = null,         // 取消定位
	locateGetSub = null;            // 获取定位


function DisksList() {
	const navigate = useNavigate();

	const [data, setData] = useState([]);
	const [tableParams, setTableParams] = useState({pagination: {current: 1, pageSize: 15, showSizeChanger: true, pageSizeOptions: [10, 15, 20, 50]}});
	const [openModal, setOpen] = useState(false)
	const [record, setRecord] = useState({})
	const [ident_time, setTime] = useState(60)
	const [remain_time, setRemain] = useState(0)
	const [loading, setLoading] = useState(false)
	const [tableLoading, setTable] = useState(false)
	const [located, setLocated] = useState(false)
	const [disabled, setDisabled] = useState(false)


	// componentDidMount componentWillUnmount
	useEffect(() => {
		let userInfo = Cache.getUserInfo()
		if (userInfo && typeof userInfo['productType']==='number') {
			getList(userInfo['productType'])
		}
		else {
			notification.error({message: '未获取到设备类型，请联系管理员！'})
			getList(null)
		}

		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(locateConfirmSub);
			PubSub.unsubscribe(locateCancelSub);
			PubSub.unsubscribe(locateGetSub);
			if (timer !== null) {
				clearInterval(timer);
			}
		}
	}, []);

	// 获取硬盘列表  叶黄素/钙片
	const getList = (type=null) => {
		setTable(true);
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			setTable(false);
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				sortData(result, type);
			}
		})
		WebSocketService.call(uuid, URL.DISK_QUERY, [[], {extra: {pools: true}}]);
	}

	// 数据按slot排序
	const sortData = (list, type) => {
		// 将数据分为三组 系统盘/有enclosure的/没有enclosure的
		let temp = [], disks = [], noEnDisks = [], bootDisk = [];
		for (let k in list) {
			if (list[k]['pool'] === 'boot-pool') {
				bootDisk.push(list[k])
			}
			else {
				if (list[k]['enclosure'] && list[k]['enclosure']['number'] && list[k]['enclosure']['slot'] && esp[type]['es_pos'][list[k]['enclosure']['number']+'_'+list[k]['enclosure']['slot']]) {
					list[k]['position'] = esp[type]['es_pos'][list[k]['enclosure']['number']+'_'+list[k]['enclosure']['slot']]['title']
					disks.push(list[k])
				}
				else {
					noEnDisks.push(list[k])
				}
			}
		}
		disks.sort(function (a, b) {
			return a['position'] - b['position']
		})
		for (let k in bootDisk) {
			bootDisk[k]['position'] = '系统盘'+(Number(k)+1)
		}
		temp = bootDisk.concat(disks, noEnDisks)
		setData(temp)
	}

	// 点击初始化按钮
	const initialization = r => {
		if (r && r['pool']) {
			notification.error({message: '该硬盘已配置存储池 无法初始化'});
			return ;
		}
		navigate('/storage/disks/initialization?identifier='+r.identifier)
	}

	// 点击查找按钮
	const locateDisk = r => {
		if (r && r['enclosure'] && r['enclosure']['number'] && r['enclosure']['slot']) {
			setOpen(true);
			setRecord(r);
			getLocateState(r['enclosure']['number'], r['enclosure']['slot']);
			getRemainOnce(r['enclosure']['number'], r['enclosure']['slot']);
		}
		else {
			notification.error({message: '该硬盘没有位置信息'});
		}

	}

	// 发送定位命令
	const onLocateConfirm = () => {
		setLoading(true);
		let uuid = getUUID();
		locateConfirmSub = PubSub.subscribe(uuid, (_, {})=>{
			setLoading(false);
			getLocateState(record['enclosure']['number'], record['enclosure']['slot']);
		})
		WebSocketService.call(uuid, URL.DISK_LOCATE, [record['enclosure']['number']+'', record['enclosure']['slot'], 'IDENTIFY', ident_time]);
	}

	// 关闭定位状态
	const onLocateCancel = () => {
		setLoading(true);
		let uuid = getUUID();
		locateConfirmSub = PubSub.subscribe(uuid, (_, {})=>{
			setLoading(false);
			getLocateState(record['enclosure']['number'], record['enclosure']['slot']);
		})
		WebSocketService.call(uuid, URL.DISK_LOCATE, [record['enclosure']['number']+'', record['enclosure']['slot'], 'CLEAR', 0]);
	}

	// 获取当前定位状态
	const getLocateState = (enclosure, slot) => {
		let uuid = getUUID();
		locateGetSub = PubSub.subscribe(uuid, (_, {result})=>{
			setDisabled(result);
			setLocated(result);
			if (result) {
				getRemainTime(enclosure, slot);
			}
		})
		WebSocketService.call(uuid, URL.DISK_GET_LOCATE, [enclosure+'', slot]);
	}

	// 获取一次当前定位剩余时间 用于数据的立刻显示
	const getRemainOnce = (enclosure, slot) => {
		let uuid = getUUID();
		locateGetSub = PubSub.subscribe(uuid, (_, {result})=>{
			setRemain(result[0]);
			if (result[1]>0) {
				setTime(result[1]);
			}
			else setTime(60);
		})
		WebSocketService.call(uuid, URL.DISK_GET_TIME, [enclosure+'', slot]);
	}

	// 轮询获取当前定位剩余时间 用于数据更新
	const getRemainTime = (enclosure, slot) => {
		let uuid = getUUID();
		locateGetSub = PubSub.subscribe(uuid, (_, {result})=>{
			setRemain(result[0]);
			if (result[0] === 0) {
				setDisabled(false);
				setLocated(false);
			}
			if (result[0] === 0 && result[1] === 0) {
				clearInterval(timer);
			}
		})
		if (timer!==null) {
			clearInterval(timer);
		}
		timer = setInterval(()=>{WebSocketService.call(uuid, URL.DISK_GET_TIME, [enclosure+'', slot])}, 1000)
	}

	// modal onCancel
	const onCancel = () => {
		setOpen(false);
		setDisabled(false);
		setRemain(0);
		if (timer !== null) {
			clearInterval(timer);
			timer = null;
		}
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

	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '4%',
			render: (t,r,i)=>i+1
		},
		{
			title: '名称',
			dataIndex: 'name',
			width: '6%'
		},
		{
			title: (<div>位置 <Tooltip title={'物理硬盘在设备中的槽位，具体位置可以参照硬盘槽位图。'}><QuestionCircleOutlined /></Tooltip></div>),
			dataIndex: 'position',
			width: '8%',
			render: t => t?t:'unknown'
		},
		{
			title: '类型',
			dataIndex: 'type',
			width: '7%'
		},
		{
			title: (<div>容量 <Tooltip title={'硬盘厂商标称的容量值通常以1000进制计算，而实际容量通常以1024进制计算，故系统中显示的硬盘容量有可能存在些许误差，这是正常的现象。'}><QuestionCircleOutlined /></Tooltip></div>),
			dataIndex: 'size',
			width: '10%',
			render: t=> getVolume(t)
		},
		{
			title: '型号',
			dataIndex: 'model',
			width: '24%'
		},
		{
			title: '序列号',
			dataIndex: 'serial',
			width: '15%'
		},
		{
			title: '存储池',
			dataIndex: 'pool',
			width: '10%',
			render: t => t?(t==='boot-pool'?'系统池':t):'空闲'
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '12%',
			render: (t,r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} disabled={r['pool']&&r['pool']==='boot-pool'} onClick={()=>{locateDisk(r)}}>查找</Button>
						<Button type={'link'} size={'small'} disabled={r['pool']&&r['pool']==='boot-pool'} onClick={()=>{initialization(r)}}>初始化</Button>
					</Row>
				)
			}
		},
	];

	return (
		<div>
			<Table
				size={'small'}
				columns={columns}
				rowKey={(record) => record.id || record.serial}
				dataSource={data}
				pagination={tableParams.pagination}
				loading={tableLoading}
				onChange={handleTableChange}
			/>
			<Modal
				title={'定位硬盘 '+record['name']}
				open={openModal}
				footer={(
					<Row type={'flex'} justify={'end'}>
						{
							located
								?(<Button type={'primary'} onClick={onLocateCancel} loading={loading}>关闭定位</Button>)
								:(<Button type={'primary'} onClick={onLocateConfirm} loading={loading}>定位</Button>)
						}
						<Button style={{marginLeft: '10px'}} onClick={onCancel}>取消</Button>
					</Row>
				)}
				onCancel={onCancel}
			>
				<Row>单击定位按钮后，硬盘定位指示灯会亮起，以帮助您定位当前硬盘所在槽位。</Row>
				<Row type={'flex'} align={'middle'} style={{marginTop: '30px'}}>
					亮灯时间：
					<Select
						style={{width: '50%'}}
						disabled={disabled}
						value={ident_time}
						onChange={time=>setTime(time)}
						options={[{label: '1分钟', value: 60}, {label: '5分钟', value: 300}, {label: '15分钟', value: 900}, {label: '30分钟', value: 1800}, {label: '60分钟', value: 3600}]}
					/>
				</Row>
				<Row type={'flex'} align={'middle'} style={{marginTop: '30px'}}>
					剩余时间：{remain_time>60?parseInt(remain_time/60%60+'')+'分钟':(remain_time===0?'未开启':'不足一分钟')}
				</Row>
			</Modal>
		</div>
	);
}

export default DisksList;
