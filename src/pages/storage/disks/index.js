import React, {useEffect, useRef, useState} from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, notification, Modal, Select } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import BaseTablePage from "../../../component/TablePage";
import { getUUID, isEmpty } from "../../../utils/cmn";
import {WebSocketService} from "../../../server";

let timer = null,
	locateConfirmSub = null,        // 发送定位
	locateCancelSub = null,         // 取消定位
	locateGetSub = null;            // 获取定位


function Disk() {
	const navigate = useNavigate();
	const cRef = useRef(null)
	const [openModal, setOpen] = useState(false)
	const [record, setRecord] = useState({})
	const [ident_time, setTime] = useState(60)
	const [remain_time, setRemain] = useState(0)
	const [loading, setLoading] = useState(false)
	const [located, setLocated] = useState(false)
	const [disabled, setDisabled] = useState(false)


	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {
			PubSub.unsubscribe(locateConfirmSub);
			PubSub.unsubscribe(locateCancelSub);
			PubSub.unsubscribe(locateGetSub);
			if (timer !== null) {
				clearInterval(timer);
			}
		}
	}, []);

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
			getRemainTime(r['enclosure']['number'], r['enclosure']['slot']);
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
		})
		WebSocketService.call(uuid, URL.DISK_GET_LOCATE, [enclosure+'', slot]);
	}

	// 获取一次当前定位剩余时间 用于数据的立刻显示
	const getRemainOnce = (enclosure, slot) => {
		let uuid = getUUID();
		locateGetSub = PubSub.subscribe(uuid, (_, {result})=>{
			setRemain(result[0]);
			if (result[1]>0) setTime(result[1]);
			else setTime(60);
		})
		WebSocketService.call(uuid, URL.DISK_GET_TIME, [enclosure+'', slot]);
	}

	// 轮询获取当前定位剩余时间 用于数据更新
	const getRemainTime = (enclosure, slot) => {
		let uuid = getUUID();
		locateGetSub = PubSub.subscribe(uuid, (_, {result})=>{
			setRemain(result[0]);
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
			title: '位置(Enc-Slot)',
			dataIndex: 'enclosure',
			width: '9%',
			sorter: (a, b) => {
				if (a && b && a.number && b.number) {
					return a.number - b.number
				}
			},
			sortDirections: ['ascend'],
			defaultSortOrder: 'ascend',
			render: (t) => {
				if (isEmpty(t) || isEmpty(t['number'])) {
					return 'N/A'
				}
				return t.number+'-'+t.slot
			}
		},
		{
			title: '类型',
			dataIndex: 'type',
			width: '7%'
		},
		{
			title: '容量',
			dataIndex: 'size',
			width: '10%',
			render: t=>(t/1024/1024/1024).toFixed(2)+' GiB'
		},
		{
			title: '型号',
			dataIndex: 'model',
			width: '20%'
		},
		{
			title: '序列号',
			dataIndex: 'serial',
			width: '14%'
		},
		{
			title: '存储池',
			dataIndex: 'pool',
			width: '14%',
			render: t => t?t:'N/A'
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '12%',
			render: (t,r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{locateDisk(r)}}>查找</Button>
						<Button type={'link'} size={'small'} onClick={()=>{initialization(r)}}>初始化</Button>
					</Row>
				)
			}
		},
	];


	return (
		<>
			<BaseTablePage
				ref={cRef}
				title={'硬盘列表'}
				subTitle={'显示物理硬盘盘列表的摘要，定位特定的物理硬盘，修改全局设置。'}
				url={URL.DISK_QUERY}
				columns={columns}
				params={[[], {extra: {pools: true}}]}
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
		</>
	);
}

export default Disk;
