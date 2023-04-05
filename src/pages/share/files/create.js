import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Select, Input, InputNumber, Form, Radio, notification, Modal, Checkbox, Spin } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty, tailFormItemLayout } from "../../../utils/cmn";

let poolSub = null,         // 获取所有池 用于生成选项
	datasetSub = null,      // 获取数据集 用于去重判断
	createSub = null,       // 创建数据集
	protocolSub = null;     // 为数据集添加协议

let protocolNum = 0;
let timer = null;
const createProtocol = {nfs: 'sharing.nfs.create', smb: 'sharing.smb.create', webdav: 'sharing.webdav.create'}

function PoolCreate() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(false)
	const [options, setOptions] = useState([])      // 存储池选项
	const [usedName, setUsed] = useState([])        // 已使用名字列表
	const [quotaDisabled, setQuota] = useState(false)   // 是否设定配额


	// componentDidMount componentWillUnmount
	useEffect(() => {
		getPoolInfo();


		return () => {
			PubSub.unsubscribe(poolSub);
			PubSub.unsubscribe(datasetSub);
			PubSub.unsubscribe(createSub);
		}
	}, []);

	// 获取存储池 生成选项
	const getPoolInfo = () => {
		if (WebSocketService) {
			let uuid = getUUID();
			poolSub = PubSub.subscribe(uuid, (_, {result})=>{
				let temp = [], queryList = [];
				for (let k in result) {
					temp.push({label: result[k]['name'], value: result[k]['name']})
					queryList.push(result[k]['name'])
				}
				setOptions(temp);
				getUsed(queryList)
			})
			WebSocketService.call(uuid, URL.POOL_QUERY);
		}
	}

	// 根据存储池获取现有目录 用于去重判定
	const getUsed = list => {
		let uuid = getUUID();
		datasetSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = {}
			for (let k in result) {
				temp[result[k]['id']] = [];
				for (let m in result[k]['children']) {
					temp[result[k]['id']].push(result[k]['children'][m]['name'].slice(result[k]['children'][m]['pool'].length+1))
				}
			}
			setUsed(temp);
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[['id', 'in', list]]]);
	}

	//
	const handleSubmit = values => {
		let params = {}
		params['name'] = values['pool']+'/'+values['name'];
		params['compression'] = values['compression'];
		params['sync'] = values['sync'];
		if (values['refquota']) {
			params['refquota'] = values['refquota'];
			let flag = 3
			if (values['suffix'] === 'MB') flag = 2
			else if (values['suffix'] === 'TB') flag = 4
			params['refquota'] = params['refquota']*Math.pow(1024, flag);
		}

		Modal.confirm({
			title: '确认操作',
			content: '是否确认创建 '+params['name'],
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					createSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						if (result) {
							resolve();
							if (isEmpty(values['protocol'])){
								notification.success({message: '创建成功'});
								navigate('/share/files');
							}
							else {
								addProtocol(result, values['protocol'])
							}
						}
						else if (error) {

						}
					})
					WebSocketService.call(uuid, URL.DATASET_CREATE, [params]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// 为新创建的共享文件添加协议
	const addProtocol = (data, protocol) => {
		setLoading(true);
		protocolNum = 0;
		if (timer !== null) {
			clearInterval(timer)
		}
		timer = setInterval(()=>{
			if (protocolNum === protocol.length) {
				clearInterval(timer)
				notification.success({message: '创建成功'});
				navigate('/share/files');
			}
		}, 500)
		let uuid = getUUID();
		protocolSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (result) {
				protocolNum++
			}
			else if (error) {
				clearInterval(timer)
				notification.success({message: '创建成功，但有共享协议开启失败，请稍后再试'});
				navigate('/share/files');
			}
		})
		for (let k in protocol) {
			let params = {}
			if (protocol[k] === 'sharing.smb.create') {
				params = {path: data['mountpoint'], name: data['name'].slice(data['pool'].length+1), purpose: "DEFAULT_SHARE", enabled: true}
			}
			else if (protocol[k] === 'sharing.nfs.create') {
				params = {paths: [data['mountpoint']], enabled: true}
			}
			else if (protocol[k] === 'sharing.webdav.create') {
				params = {name: data['name'].replace('/', ''), path: data['mountpoint'], perm: true, enabled: true}
			}

			setTimeout(()=>{
				WebSocketService.call(uuid, protocol[k], [params]);
			}, (Number(k)+1)*500)
		}
	}

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'pool') {
			form.validateFields(['name']).then()
		}
	}

	const suffixSelector = (
		<Form.Item name="suffix" noStyle>
			<Select style={{width: 70}} defaultValue={'GB'} options={[{label: 'MB', value: 'MB'},{label: 'GB', value: 'GB'},{label: 'TB', value: 'TB'}]}/>
		</Form.Item>
	);

	return (
		<Spin tip="开启共享协议中，请稍后..." size="large" spinning={loading}>
			<div className={'full-page'}>
				<Row className={'title'}>新建共享文件</Row>
				<Row className={'sub-title'}>创建具有特定存储池，目录，容量等设置的心的共享文件</Row>
				<Row type={'flex'} style={{marginTop: '4vh'}}>
					<Form
						labelCol={{span: 6}}
						wrapperCol={{span: 18}}
						layout="horizontal"
						initialValues={{size: 'default',}}
						size={'default'}
						style={{width: 500}}
						form={form}
						onFinish={handleSubmit}
						onValuesChange={onDataChange}
					>
						<Form.Item label="存储池" name="pool" rules={[{required: true, message: '请选择存储池！'}]}>
							<Select
								allowClear
								style={{width: '100%',}}
								placeholder="请选择存储池"
								options={options}
							/>
						</Form.Item>
						<Form.Item label="目录名称" name="name" rules={[
							{required: true, message: '请输入目录名称！'},
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!isEmpty(getFieldValue('pool'))
										&& !isEmpty(usedName[getFieldValue('pool')])
										&& usedName[getFieldValue('pool')].includes(value)) {
										return Promise.reject(new Error('该名称已被使用！'));
									}
									return Promise.resolve();
								},
							})
						]}>
							<Input placeholder="请输入目录名称"/>
						</Form.Item>
						<Row type={'flex'} style={{marginBottom: '20px'}}>
							<Col span={6}>
								<Row type={'flex'} justify={'end'}>
									<Checkbox value="multiple" onChange={e=>{setQuota(e.target.checked)}}>开启配额</Checkbox>
								</Row>
							</Col>
						</Row>
						{
							quotaDisabled?(
								<Form.Item label="配额大小" name="refquota" rules={[{required: true, message: '请输入配额大小！'}]}>
									<InputNumber placeholder="请输入配额大小" addonAfter={suffixSelector}/>
								</Form.Item>
							):''
						}


						<Row>
							<Col span={6}><Row type={'flex'} justify={'end'}>启用协议<span style={{marginLeft: '2px', marginRight: '8px'}}>:</span></Row></Col>
							<Col span={18}></Col>
						</Row>



						<Form.Item label="启用协议" name="protocol">
							<Checkbox.Group>
								<Checkbox value="sharing.smb.create">SMB</Checkbox>
								<Checkbox value="sharing.nfs.create">NFS</Checkbox>
								<Checkbox value="sharing.webdav.create">WEBDAV</Checkbox>
							</Checkbox.Group>
						</Form.Item>
						<Form.Item label="同步模式" name="sync" rules={[{required: true, message: '请选择同步模式！'}]}>
							<Radio.Group>
								<Radio value="STANDARD">标准</Radio>
								<Radio value="ALWAYS">总是</Radio>
								<Radio value="DISABLED">禁用</Radio>
							</Radio.Group>
						</Form.Item>
						<Form.Item label="压缩" name="compression" rules={[{required: true, message: '请选择是否启用压缩！'}]}>
							<Radio.Group>
								<Radio value="LZ4">启用</Radio>
								<Radio value="OFF">禁用</Radio>
							</Radio.Group>
						</Form.Item>
						<Form.Item {...tailFormItemLayout(6)}>
							<Button type="primary" htmlType="submit">
								确定
							</Button>
							<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/share/files')}}>
								取消
							</Button>
						</Form.Item>
					</Form>
				</Row>
			</div>
		</Spin>
	);
}

export default PoolCreate;
