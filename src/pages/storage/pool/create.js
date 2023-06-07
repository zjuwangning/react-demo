import React, { useEffect, useState } from 'react';
import {Row, Col, Button, Select, Input, Form, Radio, notification, Modal, Progress, Popover} from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import DisksSlot from "../../../component/DiskSlot";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty, cpy, getVolume } from "../../../utils/cmn";
import {esp} from "../../../component/DiskSlot/enum";
import Cache from "../../../utils/Cache";

let poolSub = null,     // 获取所有池 判断新建的池名称是否重复
	diskSub = null,     // 获取空闲可用硬盘
	createSub = null,   // 新建存储池
	percentSub = null;  // 监听创建过程数据上报

let type = null


function PoolCreate() {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false)
	const [poolList, setPool] = useState([])        // 全部存储池

	const [diskList, setDisk] = useState([])                // 全部可用硬盘列表
	const [dataOptions, setDataOption] = useState([])       // 数据盘选项
	const [cacheOptions, setCacheOption] = useState([])     // 缓存盘选项
	const [sparesOptions, setSparesOption] = useState([])   // 热备盘选项

	const [raidOptions, setRaidOption] = useState([])       // RAID级别选项
	const [cacheDisabled, setDisabled] = useState(true)     // 缓存盘是否可选
	const [opened, setModal] = useState(false)  // 创建确认弹窗
	const [percent, setPercent] = useState(0)   // 创建进度
	const navigate = useNavigate();


	// componentDidMount componentWillUnmount
	useEffect(() => {
		let userInfo = Cache.getUserInfo()
		if (userInfo && typeof userInfo['productType']==='number') {
			type = userInfo['productType']
		}

		if (WebSocketService) {
			getPool();
			getDisk();
		}

		return () => {
			PubSub.unsubscribe(poolSub);
			PubSub.unsubscribe(diskSub);
			PubSub.unsubscribe(createSub);
			PubSub.unsubscribe(percentSub);
		}
	}, []);

	// 获取数据池信息
	const getPool = () => {
		let uuid = getUUID();
		poolSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = [];
			for (let k in result) {
				temp.push(result[k]['name'])
			}
			setPool(temp);
		})
		WebSocketService.call(uuid, URL.POOL_QUERY);
	}

	// 获取可用硬盘
	const getDisk = () => {
		let uuid = getUUID();
		diskSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (result.length === 0) {
				notification.warning({message: '暂无可用硬盘'})
			}

			let temp = [], enDisks = [], noEnDisks = [], disks = [];
			// 按title给result排序 将数组分为有enclosure和无enclosure两部分 有enclosure的按位置title排序
			for (let k in result) {
				if (type && result[k]['enclosure'] && result[k]['enclosure']['number'] && result[k]['enclosure']['slot'] && esp[type]['es_pos'][result[k]['enclosure']['number']+'_'+result[k]['enclosure']['slot']]) {
					result[k]['position'] = esp[type]['es_pos'][result[k]['enclosure']['number']+'_'+result[k]['enclosure']['slot']]['title']
					enDisks.push(result[k])
				}
				else {
					result[k]['position'] = 'unknown'
					noEnDisks.push(result[k])
				}
			}
			enDisks.sort(function (a, b) {
				return a['position'] - b['position']
			})
			disks = enDisks.concat(noEnDisks);
			for (let k in disks) {
				if (disks[k]['type'] === 'SSD') {
					let label = `${disks[k]['name']}（位置-${disks[k]['position']}; ${disks[k]['type']}; ${getVolume(disks[k]['size'], 2)}）`
					temp.push({label, value: disks[k]['name']})
				}
			}
			setCacheOption(temp);
			setDisk(disks);
		})
		WebSocketService.call(uuid, URL.DISK_UNUSED);
	}

	// 确认创建存储池
	const confirmCreate = () => {
		let temp = form.getFieldsValue();
		let topology = {data: [{type: temp['raid'], disks: temp['data']}]};
		if (temp['raid'] === 'RAID1E') {
			topology = {data: [{type: 'MIRROR', disks: temp['data']}]};
		}
		else if (temp['raid'] === 'RAID10') {
			let data=[], disks = [], index = 0;
			for (let k in temp['data']) {
				disks.push(temp['data'][k]);
				index++
				if (index===2) {
					index = 0;
					data.push({type: 'MIRROR', disks});
					disks = []
				}
			}
			topology={data}
		}
		if (!isEmpty(temp['cache'])) topology['cache'] = [{type: 'STRIPE', disks: temp['cache']}];
		if (!isEmpty(temp['spares'])) topology['spares'] = temp['spares'];

		let uuid = getUUID();
		setLoading(true);
		createSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (!isEmpty(result)) {     // 开启创建流程监听
				getProgress(result);
			}
			else {
				setLoading(false);
			}
		})
		WebSocketService.call(uuid, URL.POOL_CREATE, [{encryption: false, name: temp['name'], topology}])
	}

	// 开启创建流程监听
	const getProgress = id => {
		PubSub.unsubscribe(percentSub);

		percentSub = PubSub.subscribe('pool.create-'+id, (_, {result}) => {
			setPercent(result['progress']['percent'])
			if (result['state'] === 'SUCCESS') {
				notification.success({message: '创建存储池完成'});
				navigate('/storage/pools')
			}
			else if (result['state'] === 'FAILED') {
				setLoading(false);
				setModal(false);
				setPercent(0);
				Modal.error({title: '创建存储池失败', content: result['error']})
			}
		})
	}

	const handleSubmit = (values) => {
		setModal(true)
	}

	const poolNameHead = (_, value) => {
		const reg = /^[a-zA-Z]*$/g
		if (!isEmpty(value) && !reg.test(value[0])) {
			return Promise.reject();
		}
		return Promise.resolve();
	}

	const poolNameLength = (_, value) => {
		if (!isEmpty(value) && value.length>16) {
			return Promise.reject();
		}
		return Promise.resolve();
	}

	const poolNameUsed = (_, value) => {
		if (!isEmpty(value) && poolList.includes(value)) {
			return Promise.reject();
		}
		return Promise.resolve();
	}

	const poolNameTest = (_, value) => {
		const reg = /^[a-zA-Z0-9_\-:.]*$/g
		if (!isEmpty(value) && !reg.test(value)) {
			return Promise.reject();
		}
		return Promise.resolve();
	}

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'type') {
			form.setFieldsValue({data: undefined, spares: undefined, cache: undefined, raid: undefined})
			setRaidOption([])
			setDisabled(changedValues['type'] === 'SSD');
			let temp = []
			for (let k in diskList) {
				if (diskList[k]['type'] === changedValues['type']) {
					let label = `${diskList[k]['name']}（位置-${diskList[k]['position']}; ${diskList[k]['type']}; ${getVolume(diskList[k]['size'], 2)}）`
					temp.push({label, value: diskList[k]['name']})
				}
			}
			setDataOption(temp);
			setSparesOption(temp);
		}
		else if (changeKey === 'data') {    // 三种盘选择任一种 就要将另外两种盘内选项置不可选
			form.setFieldValue('raid', '');
			let disksNum = changedValues[changeKey].length;
			let temp = [];
			if (disksNum>0) {
				temp.push({label: 'RAID 0', value: 'STRIPE'})
				if (disksNum === 2) {
					temp.push({label: 'RAID 1', value: 'MIRROR'})
				}
				else if (disksNum>2) {
					temp.push({label: 'RAID 1E', value: 'RAID1E'})
					if (disksNum%2===0) {
						temp.push({label: 'RAID 10', value: 'RAID10'})
					}
					temp.push({label: 'RAID 5', value: 'RAIDZ1'})
					if (disksNum>3) {
						temp.push({label: 'RAID 6', value: 'RAIDZ2'})
						if (disksNum>4) {
							temp.push({label: 'RAID-TP', value: 'RAIDZ3'})
						}
					}
				}
			}
			setRaidOption(temp)

			let sparesTemp = cpy(sparesOptions);
			for (let k in sparesTemp) {
				sparesTemp[k]['disabled'] = !!(!isEmpty(allValues['data']) && allValues['data'].includes(sparesTemp[k]['value']));
			}
			setSparesOption(sparesTemp);
		}
		else if (changeKey === 'spares') {    // 三种盘选择任一种 就要将另外两种盘内选项置不可选
			let dataTemp = cpy(dataOptions);
			for (let k in dataTemp) {
				dataTemp[k]['disabled'] = !!(!isEmpty(allValues['spares']) && allValues['spares'].includes(dataTemp[k]['value']));
			}
			setDataOption(dataTemp);
		}
	}

	// 提交按钮行样式
	const tailFormItemLayout = {
		wrapperCol: {
			xs: {
				span: 24,
				offset: 0,
			},
			sm: {
				span: 14,
				offset: 4,
			},
		},
	};

	return (
		<div className={'full-page'}>
			<Row className={'title'}>新建存储池</Row>
			<Row className={'sub-title'}>创建新的存储池</Row>
			<Row type={'flex'} style={{marginTop: '4vh'}}>
				<Form
					labelCol={{span: 4}}
					wrapperCol={{span: 20}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 800}}
					form={form}
					onFinish={handleSubmit}
					onValuesChange={onDataChange}
				>
					<Form.Item label="名称" name="name" tooltip={'名称必须以字母开头且只能输入字母数字及 : . - _'} rules={[
						{required: true, message: '请输入名称！', whitespace: true},
						{validator: poolNameHead, message: '名称必须以字母开头！'},
						{validator: poolNameLength, message: '名称最长16个字符！'},
						{validator: poolNameUsed, message: '该名称已被使用！'},
						{validator: poolNameTest, message: '只能包含字母数字 : . - _ ！'}
					]}>
						<Input style={{width: '300px'}}/>
					</Form.Item>
					<Form.Item label="介质类型" name="type" rules={[{required: true, message: '请选择介质类型！'}]}>
						<Radio.Group>
							<Radio value="SSD">SSD</Radio>
							<Radio value="HDD">HDD</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item
						label="数据盘选择" name="data"
						rules={[{required: true, message: '请选择数据盘！'}]}
					>
						<Select
							mode="multiple"
							allowClear
							style={{width: '100%',}}
							placeholder="请选择数据盘"
							options={dataOptions}
						/>
					</Form.Item>
					<Form.Item label="RAID级别" name="raid" rules={[{required: true, message: '请选择RAID级别！'}]}>
						<Select
							style={{width: '300px'}}
							placeholder="请选择RAID级别"
							options={raidOptions}
						/>
					</Form.Item>
					<Form.Item label="缓存盘选择" name="cache">
						<Select
							mode="multiple"
							allowClear
							disabled={cacheDisabled}
							style={{width: '100%'}}
							placeholder="请选择缓存盘"
							options={cacheOptions}
						/>
					</Form.Item>
					{/*<Form.Item label="热备盘选择" name="spares">*/}
					<Form.Item label="热备盘选择" name="spares">
						<Select
							mode="multiple"
							allowClear
							style={{width: '100%'}}
							placeholder="请选择热备盘"
							options={sparesOptions}
						/>
					</Form.Item>
					<Row type={'flex'} style={{marginBottom: '30px', marginLeft: '133px'}}>
						<DisksSlot />
					</Row>
					<Form.Item {...tailFormItemLayout}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/storage/pools')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
			<Modal
				title={'新建存储池确认'}
				open={opened}
				onCancel={()=>{setModal(false)}}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={()=>{setModal(false)}}>取消</Button>
						<Button type={'primary'} onClick={confirmCreate} loading={loading}>确认</Button>
					</Row>
				)}
			>
				<Row>所有已添加磁盘的内容将被删除。是否确认创建？</Row>
				<Row type={'flex'} align={'middle'} style={{marginTop: '30px'}}>
					进度： <Col span={18}><Progress percent={percent} size="small" status="active" /></Col>
				</Row>
			</Modal>
		</div>
	);
}

export default PoolCreate;
