import React, { useEffect, useState } from 'react';
import {useNavigate, useSearchParams} from "react-router-dom";
import { Row, notification, Form, Select, Col, Checkbox, InputNumber, Radio, Button, Spin, Modal } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {tailFormItemLayout, getUUID, isEmpty} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let datasetSub = null,
	shareSub = null,
	protocolSub = null,
	updateSub = null;

let protocolNum = 0;
let timer = null;

const createProtocol = {nfs: 'sharing.nfs.create', smb: 'sharing.smb.create', webdav: 'sharing.webdav.create'}
const deleteProtocol = {nfs: 'sharing.nfs.delete', smb: 'sharing.smb.delete', webdav: 'sharing.webdav.delete'}


function FileEdit() {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [search] = useSearchParams();

	const [loading, setLoading] = useState(false)       // 页面加载状态
	const [dataset, setDataset] = useState({})          // 共享文件
	const [protocol, setProtocol] = useState({})        // 存储已开启的协议 用于协议的修改
	const [originData, setOrigin] = useState({})        // 已开启的协议源数据 内含id
	const [quotaDisabled, setQuota] = useState(false)   // 是否设定配额


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('id')) {
				getDataset();
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
		}
	}, []);

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
				let temp = []
				for (let k in result) {
					if (result[k] !== false) {
						temp.push(k+'')
					}
				}
				setDataset(data);
				setProtocol(temp);
				setOrigin(result);
				form.setFieldsValue({protocol: temp, sync: data['sync']['value'], compression: data['compression']['value'], })
				setLoading(false);
			}
		})
		WebSocketService.call(uuid, URL.DATASET_SHARE_ITEM, [data['mountpoint']]);
	}

	//
	const handleSubmit = values => {
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
							checkProtocol(values['protocol'])
						}
					})
					WebSocketService.call(uuid, URL.DATASET_UPDATE, [dataset['id'], params]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// checkProtocol
	const checkProtocol = nextPro => {
		let addProtocol = [], delProtocol = [];
		for (let k in protocol) {
			if (!nextPro.includes(protocol[k])) {
				delProtocol.push(protocol[k])
			}
		}
		for (let k in nextPro) {
			if (!protocol.includes(nextPro[k])) {
				addProtocol.push(nextPro[k])
			}
		}
		// 共享协议无变化 直接返回前一页
		if (isEmpty(addProtocol) && isEmpty(delProtocol)) {
			notification.success({message: '修改成功'});
			navigate('/share/files');
		}
		// 共享协议发生变化 修改协议
		else {
			editProtocol(addProtocol, delProtocol);
		}
	}

	// editProtocol
	const editProtocol = (add, del) => {
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
				params = {path: dataset['mountpoint'], name: dataset['name'].slice(dataset['pool'].length+1), purpose: "DEFAULT_SHARE", enabled: true}
			}
			else if (add[k] === 'nfs') {
				params = {paths: [dataset['mountpoint']], enabled: true}
			}
			else if (add[k] === 'webdav') {
				params = {name: dataset['name'].replace('/', ''), path: dataset['mountpoint'], perm: true, enabled: true}
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
	}

	//
	const suffixSelector = (
		<Form.Item name="suffix" noStyle>
			<Select style={{width: 70}} defaultValue={'GB'} options={[{label: 'MB', value: 'MB'},{label: 'GB', value: 'GB'},{label: 'TB', value: 'TB'}]}/>
		</Form.Item>
	);


	return (
		<Spin tip="请稍后..." size="large" spinning={loading} delay={500}>
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
						<Form.Item label="启用协议" name="protocol">
							<Checkbox.Group>
								<Checkbox value="smb">SMB</Checkbox>
								<Checkbox value="nfs">NFS</Checkbox>
								<Checkbox value="webdav">WEBDAV</Checkbox>
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

export default FileEdit;
