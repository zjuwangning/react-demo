import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Select, Input, Form, Radio, notification, Modal, Progress } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty, cpy } from "../../../utils/cmn";
import './index.less'

let poolSub = null,     // 获取所有池 判断新建的池名称是否重复
	diskSub = null,     // 获取空闲可用硬盘
	createSub = null,   // 新建存储池
	percentSub = null;  // 监听创建过程数据上报


function PoolCreate() {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false)
	const [type, setType] = useState(1)             // 机壳图类型 1为24*1  2为3*4
	const [poolList, setPool] = useState([])        // 全部存储池
	const [dataOptions, setDataOption] = useState([])       // 数据盘选项
	const [cacheOptions, setCacheOption] = useState([])     // 缓存盘选项
	const [sparesOptions, setSparesOption] = useState([])   // 热备盘选项
	const [cacheDisabled, setDisabled] = useState(true)     // 缓存盘是否可选
	const [opened, setModal] = useState(false)  // 创建确认弹窗
	const [box, setBox] = useState([])    // 显示机壳图
	const [percent, setPercent] = useState(0)   // 创建进度
	const navigate = useNavigate();


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			let uuid = getUUID();
			poolSub = PubSub.subscribe(uuid, (_, {result})=>{
				let temp = [];
				for (let k in result) {
					temp.push(result[k]['name'])
				}
				setPool(temp);
			})
			WebSocketService.call(uuid, URL.POOL_QUERY);

			uuid = getUUID();
			diskSub = PubSub.subscribe(uuid, (_, {result})=>{
				let temp = [], slotList=[];
				for (let k in result) {
					temp.push({label: '位置-'+result[k]['enclosure']['slot'], value: result[k]['name']})
					slotList.push(result[k]['enclosure']['slot']);
				}
				if (isEmpty(temp)) {
					notification.warning({message: '暂无可用硬盘'})
				}
				setDataOption(temp);
				setCacheOption(temp);
				setSparesOption(temp);
				generateBox(1, slotList);
			})
			WebSocketService.call(uuid, URL.DISK_UNUSED);
		}

		return () => {
			PubSub.unsubscribe(poolSub);
			PubSub.unsubscribe(diskSub);
			PubSub.unsubscribe(createSub);
			PubSub.unsubscribe(percentSub);
		}
	}, []);

	// 页面首次加载时 渲染机壳图
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

	// 确认创建存储池
	const confirmCreate = () => {
		let temp = form.getFieldsValue();
		// let topology = {data: [{type: temp['raid'], disks: temp['data']}]};
		let topology = {data: [{type: 'MIRROR', disks: temp['data']}]};
		if (!isEmpty(temp['cache'])) topology['cache'] = [{type: 'STRIPE', disks: temp['cache']}];
		if (!isEmpty(temp['spares'])) topology['spares'] = temp['spares'];

		let uuid = getUUID();
		setLoading(true);
		createSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (!isEmpty(result)) {     // 开启创建流程监听
				percentSub = PubSub.subscribe('pool.create-'+result, (_, {result}) => {
					setPercent(result['progress']['percent'])
					if (result['state'] === 'SUCCESS') {
						notification.success({message: '创建存储池完成'});
						navigate('/storage/pools')
					}
					else if (result['state'] === 'FAILED') {
						setLoading(false);
					}
				})
			}
			else {
				setLoading(false);
			}
		})
		WebSocketService.call(uuid, URL.POOL_CREATE, [{encryption: false, name: temp['name'], topology}])
	}

	const handleSubmit = values => {
		setModal(true)
	}

	const poolNameUsed = (_, value) => {
		if (!isEmpty(value) && poolList.includes(value)) {
			return Promise.reject();
		}
		return Promise.resolve();
	}


	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'type') {
			if (changedValues['type'] === 'multiple') {
				setDisabled(false);
				let cacheTemp = cpy(cacheOptions);
				for (let k in cacheTemp) {
					cacheTemp[k]['disabled'] = !!((!isEmpty(allValues['spares']) && allValues['spares'].includes(cacheTemp[k]['value']))
						|| (!isEmpty(allValues['data']) && allValues['data'].includes(cacheTemp[k]['value'])));
				}
				setCacheOption(cacheTemp);
			}
			else {
				form.setFieldsValue({cache: undefined})
				setDisabled(true);
				let dataTemp = cpy(dataOptions);
				let sparesTemp = cpy(sparesOptions);
				for (let k in dataTemp) {
					dataTemp[k]['disabled'] = !!(!isEmpty(allValues['spares']) && allValues['spares'].includes(dataTemp[k]['value']));
				}
				for (let k in sparesTemp) {
					sparesTemp[k]['disabled'] = !!(!isEmpty(allValues['data']) && allValues['data'].includes(sparesTemp[k]['value']));
				}
				setDataOption(dataTemp);
				setSparesOption(sparesTemp);
			}
		}
		else if (changeKey === 'data') {    // 三种盘选择任一种 就要将另外两种盘内选项置不可选
			let cacheTemp = cpy(cacheOptions);
			let sparesTemp = cpy(sparesOptions);
			for (let k in cacheTemp) {
				cacheTemp[k]['disabled'] = !!((!isEmpty(allValues['data']) && allValues['data'].includes(cacheTemp[k]['value']))
					|| (!isEmpty(allValues['spares']) && allValues['spares'].includes(cacheTemp[k]['value'])));
			}
			for (let k in sparesTemp) {
				sparesTemp[k]['disabled'] = !!((!isEmpty(allValues['data']) && allValues['data'].includes(sparesTemp[k]['value']))
					|| (!isEmpty(allValues['cache']) && allValues['cache'].includes(sparesTemp[k]['value'])));
			}
			setCacheOption(cacheTemp);
			setSparesOption(sparesTemp);
		}
		else if (changeKey === 'spares') {    // 三种盘选择任一种 就要将另外两种盘内选项置不可选
			let dataTemp = cpy(dataOptions);
			let cacheTemp = cpy(cacheOptions);
			for (let k in dataTemp) {
				dataTemp[k]['disabled'] = !!((!isEmpty(allValues['spares']) && allValues['spares'].includes(dataTemp[k]['value']))
					|| (!isEmpty(allValues['cache']) && allValues['cache'].includes(dataTemp[k]['value'])));
			}
			for (let k in cacheTemp) {
				cacheTemp[k]['disabled'] = !!((!isEmpty(allValues['spares']) && allValues['spares'].includes(cacheTemp[k]['value']))
					|| (!isEmpty(allValues['data']) && allValues['data'].includes(cacheTemp[k]['value'])));
			}
			setDataOption(dataTemp);
			setCacheOption(cacheTemp);
		}
		else if (changeKey === 'cache') {    // 三种盘选择任一种 就要将另外两种盘内选项置不可选
			let dataTemp = cpy(dataOptions);
			let sparesTemp = cpy(sparesOptions);
			for (let k in dataTemp) {
				dataTemp[k]['disabled'] = !!((!isEmpty(allValues['spares']) && allValues['spares'].includes(dataTemp[k]['value']))
					|| (!isEmpty(allValues['cache']) && allValues['cache'].includes(dataTemp[k]['value'])));
			}
			for (let k in sparesTemp) {
				sparesTemp[k]['disabled'] = !!((!isEmpty(allValues['data']) && allValues['data'].includes(sparesTemp[k]['value']))
					|| (!isEmpty(allValues['cache']) && allValues['cache'].includes(sparesTemp[k]['value'])));
			}
			setDataOption(dataTemp);
			setSparesOption(sparesTemp);
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
					<Form.Item label="名称" name="name" rules={[
						{required: true, message: '请输入名称！', whitespace: true},
						{validator: poolNameUsed, message: '该名称已被使用！'}
					]}>
						<Input style={{width: '300px'}}/>
					</Form.Item>
					<Form.Item label="介质类型" name="type" rules={[{required: true, message: '请选择介质类型！'}]}>
						<Radio.Group>
							<Radio value="multiple">HDD+SSD</Radio>
							<Radio value="hdd">HDD</Radio>
							<Radio value="ssd">SSD</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item label="数据盘选择" name="data" rules={[{required: true, message: '请选择数据盘！'}]}>
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
							options={[
								{label: 'RAID0', value: 'RAID0'}, {label: 'RAID1', value: 'RAID1'},
								{label: 'RAID1E', value: 'RAID1E'}, {label: 'RAID10', value: 'RAID10'},
								{label: 'RAID5', value: 'RAID5'}, {label: 'RAID6', value: 'RAID6'},
								{label: 'RAIDZ3', value: 'RAIDZ3'},
							]}
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
					<Form.Item label="热备盘选择" name="spares">
						<Select
							mode="multiple"
							allowClear
							style={{width: '100%'}}
							placeholder="请选择热备盘"
							options={sparesOptions}
						/>
					</Form.Item>
					<Row type={'flex'} style={{width: '800px', marginBottom: '30px', marginLeft: '133px'}}>{box}</Row>
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
						<Button>取消</Button>
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