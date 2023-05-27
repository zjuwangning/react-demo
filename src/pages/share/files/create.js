import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Select, Input, InputNumber, Form, Radio, notification, Modal, Checkbox, Spin, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty, tailFormItemLayout, cpy } from "../../../utils/cmn";

let poolSub = null,         // 获取所有池 用于生成选项
	datasetSub = null,      // 获取数据集 用于去重判断
	createSub = null,       // 创建数据集
	smbSub = null,          // 获取现有smb列表 用于去重
	davSub = null,          // 获取现有webdav列表 用于去重
	protocolSub = null,     // 为数据集添加协议
	shareSub = null,        // 获取当前共享协议状态
	openSmbSub = null,      // 开启smb
	openNfsSub = null;      // 开启nfs

let protocolNum = 0;
let timer = null;
const createProtocol = {nfs: 'sharing.nfs.create', smb: 'sharing.smb.create', webdav: 'sharing.webdav.create'}
const nameList = {'cifs': 'SMB', 'nfs': 'NFS'}

function PoolCreate() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(false)
	const [options, setOptions] = useState([])      // 存储池选项
	const [usedName, setUsed] = useState([])        // 已使用名字列表
	const [quotaDisabled, setQuota] = useState(false)   // 是否设定配额
	const [protocolList, setProtocol] = useState({smb: false, webdav: false, nfs: false}) // 设定要开启的共享协议
	const [smbName, setSmb] = useState('')  // smb协议名称
	const [davName, setDav] = useState('')  // webdav协议名称
	const [smbList, setSmbList] = useState([])  // smb协议列表 用于去重判断
	const [davList, setDavList] = useState([])  // webdav协议列表 用于去重判断
	const [shareState, setShare] = useState({}) // 共享状态 如果启用了协议但共享是关闭状态要给出提示


	// componentDidMount componentWillUnmount
	useEffect(() => {
		getPoolInfo();
		getSmb();
		getDav();
		getShare();

		return () => {
			PubSub.unsubscribe(poolSub);
			PubSub.unsubscribe(datasetSub);
			PubSub.unsubscribe(createSub);
			PubSub.unsubscribe(smbSub);
			PubSub.unsubscribe(davSub);
			PubSub.unsubscribe(protocolSub);
			PubSub.unsubscribe(shareSub);
			PubSub.unsubscribe(openSmbSub);
			PubSub.unsubscribe(openNfsSub);
		}
	}, []);

	// 获取共享协议
	const getShare = () => {
		let uuid = getUUID();
		shareSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取错误，请稍后重试'});
			}
			else {
				let temp = {}
				for (let k in result) {
					temp[nameList[result[k]['service']]] = result[k]['state']
				}
				setShare(temp);
			}
		})
		WebSocketService.call(uuid, URL.SERVICE_QUERY, [[['service', 'in', ['cifs', 'nfs']]]]);
	}

	// 获取smb协议列表 用于去重判断
	const getSmb = () => {
		PubSub.unsubscribe(smbSub);
		let uuid = getUUID();
		smbSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = [];
			for (let k in result) {
				temp.push(result[k]['name'])
			}
			setSmbList(temp);
		})
		WebSocketService.call(uuid, URL.SHARE_SMB_QUERY);
	}

	// 获取webdav协议列表 用于去重判断
	const getDav = () => {
		PubSub.unsubscribe(davSub);
		let uuid = getUUID();
		davSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = [];
			for (let k in result) {
				temp.push(result[k]['name'])
			}
			setDavList(temp);
		})
		WebSocketService.call(uuid, URL.SHARE_DAV_QUERY);
	}

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
		let temp = [], content='';
		if (protocolList['smb']) {
			temp.push(createProtocol['smb'])
			if (isEmpty(smbName)) {
				notification.error({message: '请输入SMB名称'});
				return ;
			}
			else if (smbList.includes(smbName)) {
				notification.error({message: 'SMB名称重复'});
				return ;
			}
			else if (/[%<>*?|/\\+=;:]/g.test(smbName)) {
				notification.error({message: 'SMB名称中不得包含 %<>*?|/\\+=;: 等特殊字符'});
				return ;
			}
		}
		// if (protocolList['webdav']) {
		// 	temp.push(createProtocol['webdav'])
		// 	if (isEmpty(davName)) {
		// 		notification.error({message: '请输入WEBDAV名称'});
		// 		return ;
		// 	}
		// 	else if (davList.includes(davName)) {
		// 		notification.error({message: 'WEBDAV名称重复'});
		// 		return ;
		// 	}
		// 	else if (/[^/a-zA-Z0-9]/g.test(davName)) {
		// 		notification.error({message: 'WEBDAV名称只能输入英文和数字'});
		// 		return ;
		// 	}
		// 	content = '开启WebDAV后，该共享中所有文件的所有权将更改为用户 webdav 和组 webdav 。此操作无法撤消！'
		// }
		if (protocolList['nfs']) {
			temp.push(createProtocol['nfs'])
		}

		let openArr = []
		if (protocolList['smb'] && shareState['SMB'] === 'STOPPED') {
			openArr.push('SMB')
			content = '共享文件选择了启用协议，但对应共享协议并未开启。保存共享文件创建会同时为您开启对应协议'
		}
		if (protocolList['nfs'] && shareState['NFS'] === 'STOPPED') {
			openArr.push('NFS')
			content = '共享文件选择了启用协议，但对应共享协议并未开启。保存共享文件创建会同时为您开启对应协议'
		}

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
			content: (
				<div>
					<Row>是否确认创建 {params['name']}</Row>
					<Row style={{marginTop: '1vh'}}>{content}</Row>
					{
						content !== ''?(
							<Row style={{marginTop: '1vh'}}>需开启的协议：</Row>
						):''
					}
					{
						openArr.map(item=>{
							return (<Row>- {item}</Row>)
						})
					}
				</div>
			),
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					createSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						if (result) {
							resolve();
							if (temp.length === 0){
								notification.success({message: '创建成功'});
								navigate('/share/files');
							}
							else {
								addProtocol(result, temp, openArr)
							}
						}
						else if (error) {
							Modal.error({
								title: '操作错误',
								content: error.reason
							})
						}
					})
					WebSocketService.call(uuid, URL.DATASET_CREATE, [params]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	// 为新创建的共享文件添加协议
	const addProtocol = (data, protocol, openArr) => {
		setLoading(true);
		protocolNum = 0;
		if (timer !== null) {
			clearInterval(timer)
		}
		timer = setInterval(()=>{
			if (protocolNum === protocol.length) {
				clearInterval(timer)
				if (openArr.length>0) {
					openSmb(openArr)
				}
				else {
					notification.success({message: '创建成功'});
					navigate('/share/files');
				}
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
				params = {path: data['mountpoint'], name: smbName, purpose: "DEFAULT_SHARE", enabled: true}
			}
			else if (protocol[k] === 'sharing.nfs.create') {
				params = {paths: [data['mountpoint']], enabled: true}
			}
			else if (protocol[k] === 'sharing.webdav.create') {
				params = {name: davName, path: data['mountpoint'], perm: true, enabled: true}
			}

			setTimeout(()=>{
				WebSocketService.call(uuid, protocol[k], [params]);
			}, (Number(k)+1)*500)
		}
	}

	// 开启smb
	const openSmb = (openArr) => {
		if (openArr.includes('SMB')) {
			setLoading(true);
			let uuid = getUUID();
			openSmbSub = PubSub.subscribe(uuid, (_, {error})=>{
				if (error) {
					Modal.error({
						title: '操作错误',
						content: error.reason
					})
				}
				else {
					if (openArr.length>1) {
						openNfs()
					}
					else {
						notification.success({message: '创建成功'});
						navigate('/share/files');
					}
				}
			})
			WebSocketService.call(uuid, URL.SERVICE_START, ['cifs']);
		}
		else {
			openNfs()
		}
	}

	// 开启nfs
	const openNfs = () => {
		setLoading(true);
		let uuid = getUUID();
		openNfsSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				Modal.error({
					title: '操作错误',
					content: error.reason
				})
			}
			else {
				notification.success({message: '创建成功'});
				navigate('/share/files');
			}
		})
		WebSocketService.call(uuid, URL.SERVICE_START, ['nfs']);
	}

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'pool') {
			form.validateFields(['name']).then()
		}
	}

	// 协议数据变化
	const onProtocolChange = (key, checked) => {
		let temp = cpy(protocolList);
		temp[key] = checked
		setProtocol(temp);
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

						<Row type={'flex'} align={'middle'}>
							<Col span={6}>
								<Row type={'flex'} justify={'end'}>
									启用协议<span style={{marginLeft: '2px', marginRight: '8px'}}>:</span>
								</Row>
							</Col>
							<Col>
								<Checkbox checked={protocolList['smb']} onChange={e => onProtocolChange('smb', e.target.checked)}>SMB</Checkbox>
							</Col>
							<Col style={{marginLeft: '20px'}}>
								SMB名称
								<Tooltip title="勾选SMB协议后，名称为必填。SMB名称中不得包含 %<>*?|/\+=;: 等特殊字符">
									<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
								</Tooltip>
								<span style={{marginLeft: '2px', marginRight: '8px'}}>:</span>
								<Input
									style={{width: '120px'}}
									disabled={!protocolList['smb']}
									value={smbName}
									onChange={e => setSmb(e.target.value)}
								/>
							</Col>
						</Row>
						<Row type={'flex'} align={'middle'} style={{marginBottom: '20px'}}>
							<Col span={6} />
							<Col>
								<Checkbox checked={protocolList['nfs']} onChange={e => onProtocolChange('nfs', e.target.checked)}>NFS</Checkbox>
							</Col>
						</Row>
						{/*<Row type={'flex'} align={'middle'} style={{marginBottom: '20px'}}>*/}
						{/*	<Col span={6} />*/}
						{/*	<Col>*/}
						{/*		<Checkbox checked={protocolList['webdav']} onChange={e => onProtocolChange('webdav', e.target.checked)}>WEBDAV</Checkbox>*/}
						{/*	</Col>*/}
						{/*	<Col style={{marginLeft: '20px'}}>*/}
						{/*		WEBDAV名称*/}
						{/*		<Tooltip title="勾选WEBDAV协议后，名称为必填。WEBDAV名称只能输入英文和数字">*/}
						{/*			<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>*/}
						{/*		</Tooltip>*/}
						{/*		<span style={{marginLeft: '2px', marginRight: '8px'}}>:</span>*/}
						{/*		<Input*/}
						{/*			style={{width: '120px'}}*/}
						{/*			disabled={!protocolList['webdav']}*/}
						{/*			value={davName}*/}
						{/*			onChange={e => setDav(e.target.value)}*/}
						{/*		/>*/}
						{/*	</Col>*/}
						{/*</Row>*/}

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
