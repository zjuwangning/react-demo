import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, notification, Modal, Form, Select, Input, Table, Radio } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import {PlusOutlined} from "@ant-design/icons";

let configSub = null,
	updateSub = null,
	pathSub = null,
	addSub = null,
	editSub = null,
	delSub = null,
	davSub = null;
const keyList = ['protocol', 'password', 'tcpport', 'tcpportssl'];

function WebDav() {
	const [form] = Form.useForm();
	const [davForm] = Form.useForm();
	const navigate = useNavigate();

	const [data, setData] = useState([]);       // webdav列表
	const [nameList, setList] = useState([]);   // webdav姓名列表
	const [record, setRecord] = useState({});   // webdav单条数据
	const [path, setPath] = useState([]);       // 访问路径选项
	const [loading, setLoading] = useState(false);      // 表格loading
	const [btnLoading, setBtn] = useState(false);       // 保存按钮loading
	const [title, setTitle] = useState('');
	const [open, setOpen] = useState(false);
	const [protocol, setProtocol] = useState('');

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();
		getDav();
		getPath();

		return () => {
			PubSub.unsubscribe(configSub);
			PubSub.unsubscribe(updateSub);
			PubSub.unsubscribe(davSub);
			PubSub.unsubscribe(addSub);
			PubSub.unsubscribe(editSub);
			PubSub.unsubscribe(delSub);
			PubSub.unsubscribe(pathSub);
		}
	}, []);

	// 获取smb协议config数据
	const getData = () => {
		let uuid = getUUID();
		configSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '获取SMB配置错误，请稍后重试'})
			}
			else {
				let params = {}
				if (result['protocol']) {
					setProtocol(result['protocol'])
				}
				for (let k in keyList) {
					params[keyList[k]] = result[keyList[k]]
				}
				form.setFieldsValue(params)
			}
		})
		WebSocketService.call(uuid, URL.DAV_CONFIG, []);
	}

	// 获取WebDAV访问目录
	const getDav = () => {
		PubSub.unsubscribe(davSub);
		setLoading(true);
		let uuid = getUUID();
		davSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp=[], list=[];
			if (result && result.length>0) {
				temp = result
				for (let k in result) {
					list.push(result[k]['name'])
				}
			}
			setLoading(false);
			setData(temp)
			setList(list)
		})
		WebSocketService.call(uuid, URL.SHARE_DAV_QUERY);
	}

	// 获取路径数据
	const getPath = () => {
		let uuid = getUUID();
		pathSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let pathTemp = [];
				for (let k in result) {
					if (result[k]['id'].indexOf('/')>=0) {
						pathTemp.push({label: result[k]['mountpoint'], value: result[k]['mountpoint']})
					}
				}
				setPath(pathTemp);
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[], {extra: {properties: ['mountpoint']}}]);
	}

	//
	const handleSubmit = values => {
		delete values['confirmPassword'];
		Modal.confirm({
			title: '确认操作',
			content: '确认修改WebDAV配置',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					updateSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: 'WebDAV设置错误'});
						}
						else {
							notification.success({message: 'WebDAV设置成功'});
						}
					})
					WebSocketService.call(uuid, URL.DAV_UPDATE, [values]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// 新增
	const add = () => {
		davForm.resetFields();
		setOpen(true);
		setTitle('添加WebDAV共享');
	}

	// 修改
	const edit = r => {
		davForm.resetFields();
		setOpen(true);
		setRecord(r);
		davForm.setFieldValue('ro', r['ro']?1:2)
		setTitle('编辑WebDAV共享');
	}

	// 删除
	const del = r => {
		Modal.confirm({
			title: '确认操作',
			content: '确认删除WebDAV共享',
			onOk() {
				return new Promise((resolve, reject) => {
					PubSub.unsubscribe(delSub);
					let uuid = getUUID();
					delSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						if (error) {
							notification.error({message: 'WebDAV删除错误！请稍后重试。'});
						}
						else {
							notification.success({message: 'WebDAV删除成功！'});
							getDav();
						}
						resolve();
					})
					WebSocketService.call(uuid, URL.SHARE_DAV_DELETE, [r['id']]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// 确认保存
	const confirm = () => {
		davForm.validateFields().then((values)=>{
			if (title === '添加WebDAV共享') {
				Modal.confirm({
					title: '确认添加WebDAV共享',
					content: '共享中所有文件的所有权将更改为用户 webdav 和组 webdav。现有权限不会更改，但是所有权更改可能会使文件的原始所有者无法访问。此操作无法撤消！',
					onOk: ()=>{confirmAdd(values)}
				})
			}
			else if (title === '编辑WebDAV共享') {
				confirmEdit(values);
			}
		})
	}

	// 确认新建
	const confirmAdd = values => {
		setBtn(true);
		if (values['ro'] === 1) values['ro'] = true;
		else if (values['ro'] === 2) values['ro'] = false;
		values['perm'] = true;
		values['enabled'] = true;

		let uuid = getUUID();
		PubSub.unsubscribe(addSub);
		addSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			setBtn(false);
			if (error) {
				Modal.error({title: '添加错误', content: error.reason})
			}
			else {
				notification.success({message: '添加WebDAV共享成功'});
				getDav();
				setOpen(false);
			}
		})
		WebSocketService.call(uuid, URL.SHARE_DAV_CREATE, [values]);
	}

	// 确认修改
	const confirmEdit =  values => {
		setBtn(true);
		let ro = true
		if (values['ro'] === 2) ro = false;

		let uuid = getUUID();
		PubSub.unsubscribe(editSub);
		editSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			setBtn(false);
			if (error) {
				Modal.error({title: '编辑错误', content: error.reason})
			}
			else {
				notification.success({message: '编辑WebDAV共享成功'});
				getDav();
				setOpen(false);
			}
		})
		WebSocketService.call(uuid, URL.SHARE_DAV_EDIT, [record['id'], {ro}]);
	}

	//

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'protocol') {
			setProtocol(changedValues[changeKey])
		}
	}

	//
	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '10%',
			render: (t,r,i)=>i+1
		},
		{
			title: '名称',
			dataIndex: 'name',
			width: '15%',
		},
		{
			title: '路径',
			dataIndex: 'path',
			width: '25%',
		},
		{
			title: '权限',
			dataIndex: 'ro',
			width: '30%',
			render: t=>t?'只读':'读写'
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '20%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{edit(r)}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={()=>{del(r)}}>删除</Button>
					</Row>
				)
			}
		},
	]

	const nameUse = (_, value) => {
		if (!isEmpty(value) && nameList.includes(value)) {
			return Promise.reject();
		}
		return Promise.resolve();
	}

	const nameRule = (_, value) => {
		const reg = /[^/a-zA-Z0-9]/g
		if (!isEmpty(value) && reg.test(value)) {
			return Promise.reject();
		}
		return Promise.resolve();
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>WebDAV设置</Row>
			<Row className={'sub-title'}>修改系统的WebDAV设置</Row>
			<Row className={'actions'} />
			<Row type={'flex'} style={{width: '1200px'}}>
				<Col style={{width: 550}}>
					<Row style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '30px'}}>WebDAV服务设置</Row>
					<Form
						labelCol={{span: 6,}}
						wrapperCol={{span: 14,}}
						layout="horizontal"
						initialValues={{size: 'default',}}
						size={'default'}
						style={{width: 550}}
						form={form}
						onFinish={handleSubmit}
						onValuesChange={onDataChange}
					>
						<Form.Item
							label="协议选择" name={'protocol'}
							rules={[{ required: true, message: '请选择协议！' }]}
							tooltip={'HTTP会保持连接不加密。HTTPS会加密连接。HTTP+HTTPS 同时允许两种类型的连接。'}
						>
							<Select options={[{label: 'HTTP', value: 'HTTP'}, {label: 'HTTPS', value: 'HTTPS'}, {label: 'HTTP+HTTPS', value: 'HTTPHTTPS'}]}/>
						</Form.Item>
						{
							protocol === 'HTTP' || protocol === 'HTTPHTTPS'?(
								<Form.Item
									label="HTTP端口" name={'tcpport'}
									rules={[{ required: true, message: '请填写HTTP端口！' }]}
									tooltip={'为HTTP连接指定端口。推荐默认端口8080。不要重复一个端口。'}
								>
									<Input />
								</Form.Item>
							):''
						}
						{
							protocol === 'HTTPS' || protocol === 'HTTPHTTPS'?(
								<Form.Item
									label="HTTPS端口" name={'tcpportssl'}
									rules={[{ required: true, message: '请填写HTTPS端口！' }]}
									tooltip={'为HTTPS连接指定端口。推荐默认端口8081。不要重复一个端口。'}
								>
									<Input />
								</Form.Item>
							):''
						}


						<Form.Item label="用户名" name={'description'}>
							webdav
						</Form.Item>
						<Form.Item
							label="设置密码" name="password"
							rules={[{ required: true, message: '请设置连接密码！' }]}
						>
							<Input.Password/>
						</Form.Item>
						<Form.Item label="确认密码" name="confirmPassword" rules={[
							({ getFieldValue }) => ({
								validator(_, value) {
									if (getFieldValue('password') === value) {
										return Promise.resolve();
									}
									return Promise.reject(new Error('两次输入密码不匹配！'));
								},
							}),
						]}>
							<Input.Password/>
						</Form.Item>
						<Form.Item {...tailFormItemLayout(6)}>
							<Button type="primary" htmlType="submit">
								确定
							</Button>
							<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/share/protocol')}}>
								取消
							</Button>
						</Form.Item>
					</Form>
				</Col>
				<Col style={{width: 650}}>
					<Row style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '30px'}}>WebDAV访问目录</Row>
					<Table
						loading={loading}
						pagination={false}
						footer={() => <Row type={'flex'} justify={'center'} style={{cursor: 'pointer'}} onClick={add}><PlusOutlined style={{fontSize: '18px'}} /></Row>}
						columns={columns}
						dataSource={data}
					/>
				</Col>
			</Row>

			<Modal
				title={title}
				open={open}
				onCancel={()=>{setOpen(false)}}
				footer={null}
			>
				<Form
					labelCol={{span: 8,}}
					wrapperCol={{span: 16,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: '100%', marginTop: '4vh'}}
					form={davForm}
				>
					<Form.Item
						label="WebDAV共享名称" name={'name'} tooltip={'WebDAV共享名称只能包含数字字母'}
						rules={title==='添加WebDAV共享'?[
							{ required: true, message: '请填写WebDAV共享名称！' },
							{ validator: nameRule, message: 'WebDAV共享名称只能包含数字字母！' },
							{ validator: nameUse, message: '该名称已被使用！' },
						]:[]}
					>
						{
							title!=='添加WebDAV共享'?record['name']:(
								<Input />
							)
						}
					</Form.Item>
					<Form.Item label="WebDAV访问路径" name={'path'} rules={title==='添加WebDAV共享'?[{ required: true, message: '请选择WebDAV访问路径！' }]:[]}>
						{
							title!=='添加WebDAV共享'?record['path']:(
								<Select options={path}/>
							)
						}
					</Form.Item>
					<Form.Item label="WebDAV访问权限" name={'ro'} rules={[{ required: true, message: '请选择WebDAV访问权限！' }]}>
						<Radio.Group>
							<Radio value={1}>只读</Radio>
							<Radio value={2}>读写</Radio>
						</Radio.Group>
					</Form.Item>
					<Row type={'flex'} justify={'end'}>
						<Button type="primary" loading={btnLoading} onClick={confirm}>
							确定
						</Button>
						<Button style={{marginLeft: '10px'}} onClick={()=>{setOpen(false)}}>
							取消
						</Button>
					</Row>
				</Form>
			</Modal>
		</div>
	);
}

export default WebDav;
