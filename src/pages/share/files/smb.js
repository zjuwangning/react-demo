import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import {Row, Col, Form, Select, Modal, notification, Button, Table, Checkbox} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { isEmpty, getUUID, cpy } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let statSub = null,     // 获取权限状态
	choiceSub = null,   // 获取acl默认选项
	userSub = null,     // 获取用户 生成选项
	groupSub = null,    // 获取组 生成选项
	aclSub = null,    // 获取组 生成选项
	setAclSub = null,    // 设置acl
	progressSub = null,     // 设置acl进度监听
	aclDefaultSub = null;   // 获取acl默认选项


function SMBAuth() {
	const [form] = Form.useForm();
	const [search] = useSearchParams();

	const [userAuth, setUserAuth] = useState([]);       // smb授权用户
	const [groupAuth, setGroupAuth] = useState([]);     // smb授权组
	const [userOption, setUserOption] = useState([]);       // 用户选项
	const [groupOption, setGroupOption] = useState([]);     // 组选项
	const [btnLoading, setBtn] = useState(false);
	const [title, setTitle] = useState('');
	const [open, setOpen] = useState(false);
	const [delOpen, setDelOpen] = useState(false);
	const [aclList, setAcl] = useState([]);  // 所有acl权限列表
	const [aclInfo, setInfo] = useState({}); // acl基本信息
	const [item, setItem] = useState({}); // 要删除的权限条目


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('path')) {
				getState();
				getUser();
				getGroup();
				getProgress();
			}
			else {
				// 数据没有拿到id 跳转错误
			}
		}

		return () => {
			PubSub.unsubscribe(progressSub);
			PubSub.unsubscribe(choiceSub);
			PubSub.unsubscribe(aclDefaultSub);
			PubSub.unsubscribe(userSub);
			PubSub.unsubscribe(groupSub);
			PubSub.unsubscribe(aclSub);
			PubSub.unsubscribe(setAclSub);
			PubSub.unsubscribe(statSub);
		}
	}, []);

	// 开启监听
	const getProgress = () => {
		PubSub.unsubscribe(progressSub);
		progressSub = PubSub.subscribe(URL.FILE_ACL_SET, (_, {result})=>{
			if (result['state'] === 'SUCCESS') {
				notification.success({message: '权限设置成功'});
				setBtn(false);
				onCancel();
				getState();
			}
			else if (result['state'] === 'FAILED') {
				setBtn(false);
				onCancel();
				Modal.error({
					title: '授权错误',
					content: result.error
				})
			}
		})
	}

	// 设置用户选项
	const getUser = () => {
		PubSub.unsubscribe(userSub);
		let uuid = getUUID();
		userSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'});
				setUserOption([])
			}
			else {
				let temp = []
				for (let k in result) {
					temp.push({label: result[k]['username'], value: result[k]['uid']})
				}
				setUserOption(temp);
			}
		})
		WebSocketService.call(uuid, URL.USER_QUERY, [[['builtin', '=', false]]]);
	}

	// 设置组选项
	const getGroup = () => {
		PubSub.unsubscribe(groupSub);
		let uuid = getUUID();
		groupSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'});
				setGroupOption([])
			}
			else {
				let temp = []
				for (let k in result) {
					temp.push({label: result[k]['name'], value: result[k]['gid']})
				}
				setGroupOption(temp);
			}
		})
		WebSocketService.call(uuid, URL.GROUP_QUERY, [[['builtin', '=', false]]]);
	}

	// 获取权限状态
	const getState = () => {
		PubSub.unsubscribe(statSub);
		let uuid = getUUID();
		statSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				if (result['acl'] === false) {  // 还未开启acl 先获取acl默认值
					getAclChoices()
				}
				else {

				}
				getAclInfo(result['acl'])
			}
		})
		WebSocketService.call(uuid, URL.FILE_STATE, [search.get('path')]);
	}

	// 获取acl基本信息 包括uid gid等 保存时需要用到
	const getAclInfo = flag => {
		PubSub.unsubscribe(aclSub);
		let uuid = getUUID();
		aclSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				setInfo(result)
				// 数据以及保存过acl 不是第一次加载
				if (flag) {
					let userTemp = [], groupTemp = [], aclTemp = [];
					for (let k in result['acl']) {
						if (result['acl'][k]['tag'] === 'USER' && result['acl'][k]['who']!=='ftp') {
							userTemp.push(result['acl'][k])
						}
						else if (result['acl'][k]['tag'] === 'GROUP') {
							groupTemp.push(result['acl'][k])
						}
						let temp = cpy(result['acl'][k])
						delete temp['who']
						aclTemp.push(temp)
					}
					setUserAuth(userTemp)
					setGroupAuth(groupTemp)
					setAcl(aclTemp)
				}
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_QUERY, [search.get('path'), false, true]);
	}

	// 获取acl默认选项 FILE_ACL_CHOICES
	const getAclChoices = () => {
		PubSub.unsubscribe(choiceSub);
		let uuid = getUUID();
		choiceSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				if (isEmpty(result)) notification.error({message: '数据获取失败，请稍后重试'})
				else getAclDefault(result[0])
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_CHOICES, [search.get('path')]);
	}

	// 获取acl默认值 默认值需添加一条掩码数据
	const getAclDefault = choice => {
		PubSub.unsubscribe(aclDefaultSub);
		let uuid = getUUID();
		aclDefaultSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				notification.success({message: '暂无SMB相关权限数据，请添加'})
				let temp = result;
				temp.push({default: false, id: -1, perms: {READ: true, WRITE: true, EXECUTE: true}, tag: "MASK"})
				setAcl(temp);
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_DEFAULT, [choice]);
	}

	// 添加授权
	const confirmAdd = () => {
		form.validateFields().then((value)=>{
			let perms = {READ: false, WRITE: false, EXECUTE: false}
			for (let k in value['perms']) {
				perms[value['perms'][k]] = true
			}
			let item = {tag: title.indexOf('SMB授权用户')>=0?'USER':'GROUP', default: false, perms, id: title.indexOf('SMB授权用户')>=0?value['user']:value['group']}
			aclList.push(item);
			setAclList(aclList);
		})
	}

	const setAclList = list => {
		let param = {}
		param['acltype'] = aclInfo['acltype']
		param['gid'] = aclInfo['gid']
		param['uid'] = aclInfo['uid']
		param['path'] = aclInfo['path']
		param['options'] = {recursive: false, traverse: false}
		param['dacl'] = list;
		setBtn(true);
		PubSub.unsubscribe(setAclSub);
		let uuid = getUUID();
		setAclSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setBtn(false);
				Modal.error({
					title: '设置权限错误',
					content: error.reason
				})
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_SET, [param]);
	}

	const onOpen = (title, record=null) => {
		if (record) {
			let perms = [];
			for (let k in record['perms']) {
				if (record['perms'][k]) perms.push(k)
			}
			let param = {user: '', group: '', perms}
			if (record['tag'] === 'USER') {
				param = {user: record['id'], group: '', perms}
			}
			else if (record['tag'] === 'GROUP') {
				param = {user: '', group: record['id'], perms}
			}
			form.setFieldsValue(param)
		}
		else {
			form.setFieldsValue({user: '', group: '', perms: []})
		}
		setTitle(title);
		setOpen(true)
	}

	//
	const onDelete = (record) => {
		setDelOpen(true);
		setItem(record)
	}

	//
	const confirmDel = () => {
		let list = []
		for (let k in aclList) {
			if (aclList[k]['id']+'' === item['id']+'' && aclList[k]['tag']+'' === item['tag']+'') {
				continue ;
			}
			list.push(aclList[k])
		}
		setAclList(list);
	}

	// onCancel
	const onCancel = () => {
		setOpen(false)
		setDelOpen(false)
	}

	const userColumns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '100px',
			render: (t,r,i)=>i+1
		},
		{
			title: '用户名',
			dataIndex: 'who',
			width: '100px',
		},
		{
			title: '读权限',
			dataIndex: 'perms',
			width: '100px',
			render: t => {
				if (t && t['READ']) return(<CheckCircleOutlined style={{fontSize: '20px', color: 'green'}}/>)
				else return(<CloseCircleOutlined style={{fontSize: '20px', color: 'red'}}/>)
			}
		},
		{
			title: '写权限',
			dataIndex: 'perms',
			width: '100px',
			render: t => {
				if (t && t['WRITE']) return(<CheckCircleOutlined style={{fontSize: '20px', color: 'green'}}/>)
				else return(<CloseCircleOutlined style={{fontSize: '20px', color: 'red'}}/>)
			}
		},
		{
			title: '执行权限',
			dataIndex: 'perms',
			width: '100px',
			render: t => {
				if (t && t['EXECUTE']) return(<CheckCircleOutlined style={{fontSize: '20px', color: 'green'}}/>)
				else return(<CloseCircleOutlined style={{fontSize: '20px', color: 'red'}}/>)
			}
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '100px',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{onOpen('修改SMB授权用户权限', r)}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={()=>{onDelete(r)}}>删除</Button>
					</Row>
				)
			}
		},
	];
	const groupColumns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '100px',
			render: (t,r,i)=>i+1
		},
		{
			title: '组名',
			dataIndex: 'who',
			width: '100px',
		},
		{
			title: '读权限',
			dataIndex: 'perms',
			width: '100px',
			render: t => {
				if (t && t['READ']) return(<CheckCircleOutlined style={{fontSize: '20px', color: 'green'}}/>)
				else return(<CloseCircleOutlined style={{fontSize: '20px', color: 'red'}}/>)
			}
		},
		{
			title: '写权限',
			dataIndex: 'perms',
			width: '100px',
			render: t => {
				if (t && t['WRITE']) return(<CheckCircleOutlined style={{fontSize: '20px', color: 'green'}}/>)
				else return(<CloseCircleOutlined style={{fontSize: '20px', color: 'red'}}/>)
			}
		},
		{
			title: '执行权限',
			dataIndex: 'perms',
			width: '100px',
			render: t => {
				if (t && t['EXECUTE']) return(<CheckCircleOutlined style={{fontSize: '20px', color: 'green'}}/>)
				else return(<CloseCircleOutlined style={{fontSize: '20px', color: 'red'}}/>)
			}
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '100px',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{onOpen('修改SMB授权组权限', r)}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={()=>{onDelete(r)}}>删除</Button>
					</Row>
				)
			}
		},
	];

	return (
		<div className={'full-page'}>
			<Row className={'title'}>SMB授权</Row>
			<Row className={'sub-title'}>配置共享文件的SMB相关权限</Row>
			<Row className={'actions'} type={'flex'} align={'middle'}>共享文件路径 {search.get('path')}</Row>
			<Row type={'flex'}>
				<Col span={12}>
					<Row className={'body-title'}>SMB用户授权</Row>
					<Row className={'actions'}><Button type={'primary'} onClick={()=>{onOpen('添加SMB授权用户')}}>添加SMB授权用户</Button></Row>
					<Row style={{width: '90%'}}>
						<Table
							pagination={false}
							size={'middle'}
							style={{width: '100%'}}
							columns={userColumns}
							rowKey={(record) => record.id || record.name}
							dataSource={userAuth}
						/>
					</Row>
				</Col>
				<Col span={12}>
					<Row className={'body-title'}>SMB组授权</Row>
					<Row className={'actions'}><Button type={'primary'} onClick={()=>{onOpen('添加SMB授权组')}}>添加SMB授权组</Button></Row>
					<Row style={{width: '90%'}}>
						<Table
							pagination={false}
							size={'middle'}
							style={{width: '100%'}}
							columns={groupColumns}
							rowKey={(record) => record.id || record.name}
							dataSource={groupAuth}
						/>
					</Row>
				</Col>
			</Row>

			<Modal
				title={title}
				open={open}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={onCancel}>取消</Button>
						<Button type={'primary'} loading={btnLoading} onClick={confirmAdd}>{title.indexOf('添加')>=0?'添加':'修改'}授权</Button>
					</Row>
				)}
				onCancel={onCancel}
			>
				<Form
					labelCol={{span: 7}}
					wrapperCol={{span: 16}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: "100%", marginTop: '3vh'}}
					form={form}
				>
					{
						title.indexOf('SMB授权用户')>0?(
							<Form.Item label="用户选择" name="user" rules={[{required: true, message: '请选择SMB授权用户！'}]}>
								<Select options={userOption} disabled={title.indexOf('修改')>=0}/>
							</Form.Item>
						):(
							<Form.Item label="组选择" name="group" rules={[{required: true, message: '请选择SMB授权组！'}]}>
								<Select options={groupOption} disabled={title.indexOf('修改')>=0}/>
							</Form.Item>
						)
					}
					<Form.Item label="SMB授权权限" name="perms" rules={[{required: true, message: '请选择SMB授权权限！'}]}>
						<Checkbox.Group>
							<Checkbox value="READ">读</Checkbox>
							<Checkbox value="WRITE">写</Checkbox>
							<Checkbox value="EXECUTE">执行</Checkbox>
						</Checkbox.Group>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title={'删除确认'}
				open={delOpen}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={onCancel}>取消</Button>
						<Button type={'primary'} loading={btnLoading} onClick={confirmDel}>确认</Button>
					</Row>
				)}
				onCancel={onCancel}
			>
				是否删除 {item['tag']==='USER'?'用户':'组'} {item['who']} 权限
			</Modal>
		</div>
	);
}

export default SMBAuth;
