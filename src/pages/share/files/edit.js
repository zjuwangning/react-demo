import React, { useEffect, useState } from 'react';
import {useNavigate, useSearchParams} from "react-router-dom";
import {
	Row,
	notification,
	Form,
	Select,
	Col,
	Checkbox,
	InputNumber,
	Radio,
	Button,
	Spin,
	Modal,
	Tooltip,
	Input
} from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {tailFormItemLayout, getUUID, isEmpty, cpy} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import {QuestionCircleOutlined} from "@ant-design/icons";

let datasetSub = null,
	shareSub = null,
	protocolSub = null,
	smbSub = null,          // 获取现有smb列表 用于去重
	davSub = null,          // 获取现有webdav列表 用于去重
	updateSub = null;

let protocolNum = 0;
let timer = null;
let smbInit = '', davInit = '', listInit = {smb: false, webdav: false, nfs: false};

const createProtocol = {nfs: 'sharing.nfs.create', smb: 'sharing.smb.create', webdav: 'sharing.webdav.create'}
const deleteProtocol = {nfs: 'sharing.nfs.delete', smb: 'sharing.smb.delete', webdav: 'sharing.webdav.delete'}
const editProtocols = {nfs: 'sharing.nfs.update', smb: 'sharing.smb.update', webdav: 'sharing.webdav.update'}


function FileEdit() {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [search] = useSearchParams();

	const [loading, setLoading] = useState(false)       // 页面加载状态
	const [dataset, setDataset] = useState({})          // 共享文件
	const [originData, setOrigin] = useState({})        // 已开启的协议源数据 内含id
	const [quotaDisabled, setQuota] = useState(false)   // 是否设定配额

	const [protocolList, setProtocol] = useState({smb: false, webdav: false, nfs: false}) // 设定要开启的共享协议
	const [smbName, setSmb] = useState('')  // smb协议名称
	const [davName, setDav] = useState('')  // webdav协议名称
	const [smbList, setSmbList] = useState([])  // smb协议列表 用于去重判断
	const [davList, setDavList] = useState([])  // webdav协议列表 用于去重判断


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('id')) {
				getDataset();

				getDav();
			}
			else {
				// 数据没有拿到id 跳转错误
			}
		}

		return () => {
			PubSub.unsubscribe(datasetSub);
			PubSub.unsubscribe(shareSub);
			PubSub.unsubscribe(protocolSub);
			PubSub.unsubscribe(updateSub);
			PubSub.unsubscribe(smbSub);
			PubSub.unsubscribe(davSub);
		}
	}, []);

	// 获取smb协议列表 用于去重判断
	const getSmb = id => {
		PubSub.unsubscribe(smbSub);
		let uuid = getUUID();
		smbSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = [];
			for (let k in result) {
				temp.push(result[k]['name'])
				if (id!==false && result[k]['id']+''===id+'') {
					smbInit = result[k]['name'];
					setSmb(result[k]['name']);
				}
			}
			setSmbList(temp);
		})
		WebSocketService.call(uuid, URL.SHARE_SMB_QUERY);
	}

	// 获取webdav协议列表 用于去重判断
	const getDav = id => {
		PubSub.unsubscribe(davSub);
		let uuid = getUUID();
		davSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = [];
			for (let k in result) {
				temp.push(result[k]['name'])
				if (id!==false && result[k]['id']+''===id+'') {
					davInit = result[k]['name'];
					setDav(result[k]['name']);
				}
			}
			setDavList(temp);
		})
		WebSocketService.call(uuid, URL.SHARE_DAV_QUERY);
	}

	// 获取共享文件数据
	const getDataset = () => {
		setLoading(true);
		let uuid = getUUID();
		datasetSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
				setLoading(false);
			}
			else {
				getShare(result[0])
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[["id", "=", search.get('id')]]]);
	}

	// 获取共享文件的共享情况
	const getShare = data => {
		let uuid = getUUID();
		shareSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
				setLoading(false);
			}
			else {
				let temp = {}
				for (let k in result) {
					temp[k] = result[k]!==false
				}
				setDataset(data);
				listInit = temp;
				setProtocol(temp);
				getSmb(result['smb']);
				getDav(result['webdav']);
				setOrigin(result);
				form.setFieldsValue({sync: data['sync']['value'], compression: data['compression']['value'], })
				setLoading(false);
			}
		})
		WebSocketService.call(uuid, URL.DATASET_SHARE_ITEM, [data['mountpoint']]);
	}

	//
	const handleSubmit = values => {
		if (protocolList['smb']) {
			if (isEmpty(smbName)) {
				notification.error({message: '请输入SMB名称'});
				return ;
			}
			else if (smbInit!==smbName && smbList.includes(smbName)) {
				notification.error({message: 'SMB名称重复'});
				return ;
			}
			else if (/[^/a-zA-Z0-9]/g.test(smbName)) {
				notification.error({message: 'SMB名称只能输入英文和数字'});
				return ;
			}
		}
		if (protocolList['webdav']) {
			if (isEmpty(davName)) {
				notification.error({message: '请输入WEBDAV名称'});
				return ;
			}
			else if (davInit!==davName && davList.includes(davName)) {
				notification.error({message: 'WEBDAV名称重复'});
				return ;
			}
			else if (/[^/a-zA-Z0-9]/g.test(davName)) {
				notification.error({message: 'WEBDAV名称只能输入英文和数字'});
				return ;
			}
		}

		checkProtocol();
		return;


		let params = {}
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
			content: '是否确认修改 '+dataset['id'],
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					updateSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							notification.error({message: '修改失败，请稍后再试'})
						}
						else {
							resolve();
							checkProtocol()
						}
					})
					WebSocketService.call(uuid, URL.DATASET_UPDATE, [dataset['id'], params]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// 筛选出新增/修改/删除的共享协议
	const checkProtocol = () => {
		const keyList = ['nfs', 'smb', 'webdav'];
		let addList = [], delList = [], editList = [];
		for (let k in keyList) {
			if (listInit[keyList[k]] && !protocolList[keyList[k]]) {
				delList.push(keyList[k])
			}
			else if (!listInit[keyList[k]] && protocolList[keyList[k]]) {
				addList.push(keyList[k])
			}
			else if (listInit[keyList[k]] && protocolList[keyList[k]]) {
				if (
					(keyList[k]==='smb' && smbInit!==smbName) || (keyList[k]==='webdav' && davInit!==davName)
				) {
					editList.push(keyList[k])
				}
			}
		}
		if (isEmpty(addList) && isEmpty(delList) && isEmpty(editList)) {
			notification.success({message: '修改成功'});
			navigate('/share/files')
		}
		else {
			editProtocol(addList, delList, editList);
		}
	}

	// editProtocol
	const editProtocol = (add, del, edit) => {
		setLoading(true);
		protocolNum = 0;
		if (timer !== null) {
			clearInterval(timer)
		}
		timer = setInterval(()=>{
			if (protocolNum === add.length+del.length) {
				clearInterval(timer)
				notification.success({message: '修改成功'});
				navigate('/share/files');
			}
		}, 500)

		let uuid = getUUID();
		protocolSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				clearInterval(timer)
				notification.success({message: '修改成功，但有共享协议编辑失败，请稍后再试'});
				navigate('/share/files');
			}
			else {
				protocolNum++
			}
		})
		let index = 0;
		for (let k in add) {
			let params = {}
			if (add[k] === 'smb') {
				params = {path: dataset['mountpoint'], name: smbName, purpose: "DEFAULT_SHARE", enabled: true}
			}
			else if (add[k] === 'nfs') {
				params = {paths: [dataset['mountpoint']], enabled: true}
			}
			else if (add[k] === 'webdav') {
				params = {name: davName, path: dataset['mountpoint'], perm: true, enabled: true}
			}

			setTimeout(()=>{
				WebSocketService.call(uuid, createProtocol[add[k]], [params]);
			}, (index+1)*500)
			index++;
		}
		for (let k in del) {
			setTimeout(()=>{
				WebSocketService.call(uuid, deleteProtocol[del[k]], [originData[del[k]]]);
			}, (index+1)*500)
			index++;
		}
		for (let k in edit) {
			let params = {}
			if (edit[k] === 'smb') {
				params = {name: smbName}
			}
			else if (edit[k] === 'webdav') {
				params = {name: davName}
			}

			setTimeout(()=>{
				WebSocketService.call(uuid, editProtocols[edit[k]], [originData[edit[k]], params]);
			}, (index+1)*500)
			index++;
		}
	}

	// 协议数据变化
	const onProtocolChange = (key, checked) => {
		let temp = cpy(protocolList);
		temp[key] = checked
		setProtocol(temp);
	}

	//
	const suffixSelector = (
		<Form.Item name="suffix" noStyle>
			<Select style={{width: 70}} defaultValue={'GB'} options={[{label: 'MB', value: 'MB'},{label: 'GB', value: 'GB'},{label: 'TB', value: 'TB'}]}/>
		</Form.Item>
	);


	return (
		<Spin tip="共享协议修改中，请稍后..." size="large" spinning={loading} delay={500}>
			<div className={'full-page'}>
				<Row className={'title'}>修改共享文件</Row>
				<Row className={'sub-title'}>修改共享文件相关配置。</Row>
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
					>
						<Form.Item label="存储池" name="pool">
							{dataset['pool']}
						</Form.Item>
						<Form.Item label="目录名称" name="name">
							{isEmpty(dataset)?'':dataset['name'].slice(dataset['pool'].length+1)}
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
								<Tooltip title="勾选SMB协议后，名称为必填。SMB名称只能输入英文和数字">
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
						<Row type={'flex'} align={'middle'}>
							<Col span={6} />
							<Col>
								<Checkbox checked={protocolList['nfs']} onChange={e => onProtocolChange('nfs', e.target.checked)}>NFS</Checkbox>
							</Col>
						</Row>
						<Row type={'flex'} align={'middle'} style={{marginBottom: '20px'}}>
							<Col span={6} />
							<Col>
								<Checkbox checked={protocolList['webdav']} onChange={e => onProtocolChange('webdav', e.target.checked)}>WEBDAV</Checkbox>
							</Col>
							<Col style={{marginLeft: '20px'}}>
								WEBDAV名称
								<Tooltip title="勾选WEBDAV协议后，名称为必填。WEBDAV名称只能输入英文和数字">
									<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
								</Tooltip>
								<span style={{marginLeft: '2px', marginRight: '8px'}}>:</span>
								<Input
									style={{width: '120px'}}
									disabled={!protocolList['webdav']}
									value={davName}
									onChange={e => setDav(e.target.value)}
								/>
							</Col>
						</Row>

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

export default FileEdit;
