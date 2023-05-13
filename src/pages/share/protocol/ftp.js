import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, notification, Modal, Form, Checkbox, Input, InputNumber, Select, Table, TreeSelect, Radio } from "antd";
import { PlusOutlined } from '@ant-design/icons'
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {cpy, getUUID, isEmpty, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let configSub = null, pathSub = null, userSub = null, groupSub = null, creatGroup = null, uidSub = null, updateSub = null, ftpQuery = null,
	ftpDelete = null, ftpCreate = null, editUser = null, editGroup = null, statSub = null, aclChoiceSub = null, aclDefaultSub = null,
	aclInfoSub = null, setAclSub = null, groupItemSub = null, groupUserSub = null, editGroupUserSub = null, delGroupSub = null,
	ftpUidSub = null;

const keyList = ['port', 'loginattempt', 'clients', 'timeout_notransfer', 'ipconnections', 'timeout', 'onlyanonymous', 'anonpath', 'onlylocal']
const bandwidthList = ['localuserbw', 'localuserdlbw', 'anonuserbw', 'anonuserdlbw']
const options = [{label: 'KB', value: 0},{label: 'MB', value: 1},{label: 'GB', value: 2},{label: 'TB', value: 3}]
let index = 0;  // 索引计数用
let submitData = {}

function Ftp() {
	const [form] = Form.useForm();
	const [groupForm] = Form.useForm();
	const navigate = useNavigate();

	const [treeData, setData] = useState([]);   // 数据集列表
	const [path, setPath] = useState([]);       // ftp组访问路径选项
	const [user, setUser] = useState([]);       // ftp组成员选项
	const [anonymous, setAnonymous] = useState(false);  // 是否允许匿名登录
	const [local, setLocal] = useState(false);  // 是否允许本地用户登录
	const [open, setOpen] = useState(false);    // 弹窗是否打开
	const [delOpen, setDelOpen] = useState(false);    // 删除弹窗是否打开
	const [editOpen, setEditOpen] = useState(false);  // 编辑弹窗是否打开
	const [title, setTitle] = useState('');     // 弹窗标题
	const [ftpList, setFtp] = useState([]);     // ftp共享列表
	const [groupList, setGroupList] = useState([]);     // 是否允许匿名登录
	const [userList, setUserList] = useState([]);       // 已加入ftp组的用户
	const [loading, setLoading] = useState(false);    // 保存按钮loading
	const [record, setRecord] = useState({});    // 查看数据 编辑数据
	const [subGroups, setSub] = useState({});    // 用户副群组列表

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();
		getUser();
		getGroup();
		getPath();
		getFtp();

		return () => {
			PubSub.unsubscribe(configSub);PubSub.unsubscribe(pathSub);PubSub.unsubscribe(userSub);PubSub.unsubscribe(uidSub);
			PubSub.unsubscribe(ftpCreate);PubSub.unsubscribe(ftpQuery);PubSub.unsubscribe(updateSub);PubSub.unsubscribe(ftpDelete);
			PubSub.unsubscribe(groupSub);PubSub.unsubscribe(creatGroup);PubSub.unsubscribe(editUser);PubSub.unsubscribe(editGroup);
			PubSub.unsubscribe(statSub);PubSub.unsubscribe(aclChoiceSub);PubSub.unsubscribe(aclDefaultSub);PubSub.unsubscribe(aclInfoSub);
			PubSub.unsubscribe(setAclSub);PubSub.unsubscribe(groupUserSub);PubSub.unsubscribe(editGroupUserSub);PubSub.unsubscribe(delGroupSub);
			PubSub.unsubscribe(ftpUidSub);
			PubSub.unsubscribe(groupItemSub);
		}
	}, []);

	// 点击保存按钮
	const confirmSave = () => {
		if (title === '添加ftp共享') {
			confirmAdd();
		}
		else if (title === '编辑ftp共享') {
			confirmEdit();
		}
	}

	// 获取当前全部组数据 用于组名称去重 及 用户是否已加入ftp组的判断
	const getGroup = () => {
		let uuid = getUUID();
		groupSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = [], userTemp = [];
			result.map(item=>{
				if (!isEmpty(item) && !isEmpty(item['name'])) {
					temp.push(item['name'])
				}
				if (!isEmpty(item) && item['name'].slice(0, 3)==='ftp') {
					userTemp = userTemp.concat(item['users'])
				}
			})
			setGroupList(temp);
			setUserList(userTemp);
		})
		WebSocketService.call(uuid, URL.GROUP_QUERY);
	}

	// 获取ftp共享数据
	const getFtp = () => {
		let uuid = getUUID();
		ftpQuery = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: 'FTP共享数据获取错误'});
			}
			else {
				setFtp(result)
			}
		})
		WebSocketService.call(uuid, URL.SHARE_FTP_QUERY);
	}

	// 获取ftp协议config数据
	const getData = () => {
		let uuid = getUUID();
		configSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '获取FTP配置错误，请稍后重试'})
			}
			else {
				let params = {}
				for (let k in keyList) {
					params[keyList[k]] = result[keyList[k]]
					if (keyList[k]+'' === 'onlyanonymous' && result[keyList[k]]) {
						setAnonymous(true);
					}
					else if (keyList[k]+'' === 'onlylocal' && result[keyList[k]]) {
						setLocal(true);
					}
				}
				for (let k in bandwidthList) {
					if (result[bandwidthList[k]] && result[bandwidthList[k]]>0) {
						let flag = 0;
						while (result[bandwidthList[k]]>=1024) {
							flag++;
							result[bandwidthList[k]] /= 1024
						}
						params[bandwidthList[k]] = result[bandwidthList[k]]
						params[bandwidthList[k]+'-suffix'] = flag
					}
				}
				getFtpAnon(params);
			}
		})
		WebSocketService.call(uuid, URL.FTP_CONFIG, []);
	}

	// 获取是否有设置的匿名权限
	const getFtpAnon = params => {
		if (params['anonpath']) {
			PubSub.unsubscribe(configSub);
			let uuid = getUUID();
			configSub = PubSub.subscribe(uuid, (_, {result, error})=>{
				if (error) {
					setLoading(false);
					if (error.error === 2 && error.reason === '[ENOENT] Path not found.') {
						notification.warning({message: 'ftp配置的匿名登录路径已被删除，如需匿名登录，请重新配置其他路径'})
						delete params['anonpath']
						form.setFieldsValue(params)
					}
					else {
						notification.error({message: '数据获取失败，请稍后重试'})
					}
				}
				else {
					let anonAuth = '';
					for (let k in result['acl']) {
						if (result['acl'][k]['tag'] === 'USER' && result['acl'][k]['who'] === 'ftp') {
							anonAuth = 5;
							if (result['acl'][k]['perms']['WRITE']) {
								anonAuth = 7;
							}
						}
					}
					params['anonAuth'] = anonAuth
					form.setFieldsValue(params)
				}
			})
			WebSocketService.call(uuid, URL.FILE_ACL_QUERY, [params['anonpath'], false, true]);
		}
		else {
			form.setFieldsValue(params)
		}
	}

	// 获取用户数据 生成用户选项
	const getUser = () => {
		let uuid = getUUID();
		userSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let temp = [], subTemp = {};
				for (let k in result) {
					if (!result[k]['builtin']){
						temp.push({value: result[k]['id'], label: result[k]['username']})
						subTemp[result[k]['id']] = result[k]['groups']
					}
				}
				setUser(temp);
				setSub(subTemp);
			}
		})
		WebSocketService.call(uuid, URL.USER_QUERY);
	}

	// 获取路径数据
	const getPath = () => {
		let uuid = getUUID();
		pathSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let temp = [], pathTemp = [];
				for (let k in result) {
					if (result[k]['id'].indexOf('/')<0) {
						let children = []
						for (let m in result[k]['children']) {
							children.push({value: result[k]['children'][m]['mountpoint'], title: result[k]['children'][m]['mountpoint']})
						}
						let item = {value: result[k]['mountpoint'], title: result[k]['mountpoint'], children}
						temp.push(item)
					}
					else {
						pathTemp.push({label: result[k]['mountpoint'], value: result[k]['mountpoint']})
					}
				}
				setData(temp);
				setPath(pathTemp);
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[], {extra: {properties: ['mountpoint']}}]);
	}

	// 添加ftp共享
	const add = () => {
		groupForm.resetFields()
		setOpen(true);
		setTitle('添加ftp共享');
		let uuid = getUUID();
		uidSub = PubSub.subscribe(uuid, (_, {result})=>{groupForm.setFieldsValue({ftp_group_id: result})})
		WebSocketService.call(uuid, URL.GROUP_GID_QUERY);
	}

	// 确认添加 添加操作包括五步 判断是否符合条件->创建组->设置主用户组 及 主目录->组设置读写权限->sharing.ftp.create
	const confirmAdd = () => {
		groupForm.validateFields().then((values)=>{
			let temp = ''
			for (let k in values['user']) {
				if (userList.includes(values['user'][k])) {
					for (let m in user) {
						if (user[m]['value']+'' === values['user'][k]+'') {
							temp += user[m]['label']+' '
						}
					}
				}
			}
			if (!isEmpty(temp)) {
				Modal.error({
					title: '添加错误',
					content: `用户 ${temp} 已加入ftp组，无法再次添加ftp共享`
				})
			}
			else {
				setLoading(true);
				creatGroupFun(values);
			}
		})
	}

	// 创建组
	const creatGroupFun = values => {
		let uuid = getUUID();
		let temp = {};
		temp['name'] = values['ftp_group_name'];
		temp['gid'] = values['ftp_group_id'];
		temp['smb'] = false;
		creatGroup = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '添加错误', content: error.reason})
			}
			else {
				editUserFun(values, result, values['ftp_group_id'])
			}
		})
		WebSocketService.call(uuid, URL.GROUP_CREATE, [temp]);
	}

	// 设置用户主目录 添加附加组
	const editUserFun = (values, group, gid) => {
		index = 0
		let uuid = getUUID();
		editUser = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '添加错误', content: error.reason})
			}
			else {
				index++;
				if (values['user'].length === index) {
					getAclState(values, gid)
				}
			}
		})
		for (let k in values['user']) {
			let groups = subGroups[values['user'][k]]
			if (!groups.includes(Number(group))) {
				groups.push(Number(group))
			}
			WebSocketService.call(uuid, URL.USER_EDIT, [values['user'][k], {home: values['ftp_path'], groups}]);
		}
	}

	// 组设置读写权限 第一步 获取acl状态
	const getAclState = (values, gid) => {
		let uuid = getUUID();
		statSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '添加错误', content: '权限数据获取失败'})
			}
			else {
				getAclInfo(values, gid, result['acl'])
			}
		})
		WebSocketService.call(uuid, URL.FILE_STATE, [values['ftp_path']]);
	}

	// 获取acl基本信息 包括uid gid等 保存时需要用到
	const getAclInfo = (values, gid, flag) => {
		let uuid = getUUID();
		aclInfoSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				if (flag) {
					let aclTemp = [];
					for (let k in result['acl']) {
						let temp = cpy(result['acl'][k])
						delete temp['who']
						aclTemp.push(temp)
					}
					if (isEmpty(title)) {
						setFtpAnon(values, gid, result, aclTemp)
					}
					else {
						editGroupFun(values, gid, result, aclTemp)
					}
				}
				else {
					getAclChoices(values, gid, result)
				}
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_QUERY, [values['ftp_path'], false, true]);
	}

	// 获取acl默认选项
	const getAclChoices = (values, gid, aclInfo) => {
		let uuid = getUUID();
		aclChoiceSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '添加错误', content: '权限数据获取失败'})
			}
			else {
				if (isEmpty(result)) {
					setLoading(false);
					Modal.error({title: '添加错误', content: '权限数据获取失败'})
				}
				else getAclDefault(result[0], values, gid, aclInfo)
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_CHOICES, [values['ftp_path']]);
	}

	// 获取acl默认值 默认值需添加一条掩码数据
	const getAclDefault = (choice, values, gid, aclInfo) => {
		PubSub.unsubscribe(aclDefaultSub);
		let uuid = getUUID();
		aclDefaultSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '添加错误', content: '权限数据获取失败'})
			}
			else {
				let temp = result;
				temp.push({default: false, id: -1, perms: {READ: true, WRITE: true, EXECUTE: true}, tag: "MASK"})
				if (isEmpty(title)) {
					setFtpAnon(values, gid, aclInfo, temp)
				}
				else {
					editGroupFun(values, gid, aclInfo, temp)
				}
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_DEFAULT, [choice]);
	}

	// 组设置读写权限
	const editGroupFun = (values, gid, aclInfo, aclAuth) => {
		let perms = {READ: false, WRITE: false, EXECUTE: false}
		if (values['group_permission']+'' === '5') {
			perms = {READ: true, WRITE: false, EXECUTE: true}
		}
		else if (values['group_permission']+'' === '7') {
			perms = {READ: true, WRITE: true, EXECUTE: true}
		}
		let dacl = aclAuth
		dacl.push({tag: 'GROUP', default: false, perms, id: gid})

		let param = {}
		param['acltype'] = aclInfo['acltype']
		param['gid'] = aclInfo['gid']
		param['uid'] = aclInfo['uid']
		param['path'] = aclInfo['path']
		param['options'] = {recursive: false, traverse: false}
		param['dacl'] = dacl;

		let uuid = getUUID();
		setAclSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '设置权限错误', content: error.reason})
			}
			else {
				if (title === '编辑ftp共享') {
					ftpEditFun(values);
				}
				else if (title === '添加ftp共享') {
					ftpCreateFun(values);
				}
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_SET, [param]);
	}

	// sharing.ftp.create
	const ftpCreateFun = (params) => {
		delete params['user']
		let uuid = getUUID();
		ftpCreate = PubSub.subscribe(uuid, (_, {result, error})=>{
			setLoading(false);
			if (error) {
				Modal.error({title: '数据创建错误', content: error.reason})
			}
			else {
				notification.success({message: 'ftp共享目录创建成功'})
				getFtp();
				getGroup();
				setOpen(false)
			}
		})
		WebSocketService.call(uuid, URL.SHARE_FTP_CREATE, [params]);
	}

	// 查看ftp共享
	const view = r => {
		PubSub.unsubscribe(groupItemSub);
		groupForm.resetFields()
		let uuid = getUUID();
		groupItemSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				Modal.error({title: '数据获取错误', content: error.reason})
			}
			else {
				getGroupUser(result[0]['users'], r)
			}
		})
		WebSocketService.call(uuid, URL.GROUP_QUERY, [[["gid", "=", r['group_id']]]]);
	}

	// 获取组内所属用户信息
	const getGroupUser = (users, r) => {
		if (isEmpty(users)) {
			groupForm.setFieldsValue({group_permission: r['group_permission']})
			setRecord(r);
			setOpen(true);
			setTitle('查看ftp共享');
		}
		else {
			let uuid = getUUID();
			groupUserSub = PubSub.subscribe(uuid, (_, {result, error})=>{
				if (error) {
					Modal.error({title: '数据获取错误', content: error.reason})
				}
				else {
					let temp = r;
					r['users'] = '';
					for (let k in result) {
						r['users'] += result[k]['username']+ ' '
					}
					groupForm.setFieldsValue({group_permission: r['group_permission']})
					setRecord(temp);
					setOpen(true);
					setTitle('查看ftp共享');
				}
			})
			WebSocketService.call(uuid, URL.USER_QUERY, [[["id", "in", users]]]);
		}
	}

	// 编辑ftp共享
	const edit = r => {
		groupForm.resetFields()
		PubSub.unsubscribe(groupItemSub);
		groupForm.resetFields()
		let uuid = getUUID();
		groupItemSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				Modal.error({title: '数据获取错误', content: error.reason})
			}
			else {
				let temp = {}, item = r;
				temp['group_permission'] = r['group_permission'];
				temp['user'] = result[0]['users'];
				groupForm.setFieldsValue(temp)
				item['user'] = result[0]['users'];
				setRecord(item);
				setOpen(true);
				setTitle('编辑ftp共享');
			}
		})
		WebSocketService.call(uuid, URL.GROUP_QUERY, [[["gid", "=", r['group_id']]]]);
	}

	// 确认编辑
	const confirmEdit = () => {
		groupForm.validateFields().then((values)=>{
			let temp = '', tempList = [];
			for (let k in values['user']) {
				if (!record['user'].includes(values['user'][k])) {
					tempList.push(values['user'][k])
				}
			}
			for (let k in tempList) {
				if (userList.includes(tempList[k])) {
					for (let m in user) {
						if (user[m]['value']+'' === tempList[k]+'') {
							temp += user[m]['label']+' '
						}
					}
				}
			}
			if (!isEmpty(temp)) {
				Modal.error({
					title: '添加错误',
					content: `用户 ${temp} 已加入ftp组，无法再次添加ftp共享`
				})
			}
			else {
				setLoading(true);
				PubSub.unsubscribe(groupItemSub);
				let uuid = getUUID();
				groupItemSub = PubSub.subscribe(uuid, (_, {result, error})=>{
					if (error) {
						setLoading(false);
						Modal.error({title: '数据获取错误', content: error.reason})
					}
					else {
						editGroupUser(result[0]['id'], record, values)
					}
				})
				WebSocketService.call(uuid, URL.GROUP_QUERY, [[["gid", "=", record['group_id']]]]);
			}
		})
	}

	// 修改组成员
	const editGroupUser = (id, oldData, newData) => {
		let uuid = getUUID();
		editGroupUserSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '组成员编辑错误', content: error.reason})
			}
			else {
				editGroupAuth(id, oldData, newData)
			}
		})
		WebSocketService.call(uuid, URL.GROUP_EDIT, [id, {users: newData['user']}]);
	}

	// 修改组权限
	const editGroupAuth = (id, oldData, newData) => {
		let item = {}
		item['id'] = oldData['id']
		item['ftp_path'] = oldData['path']
		item['group_permission'] = newData['group_permission']
		getAclInfo(item, record['group_id'], true);
	}

	// 修改ftp共享列表数据
	const ftpEditFun = values => {
		let temp = {}
		temp['ftp_path'] = values['ftp_path']
		temp['group_permission'] = values['group_permission']
		let uuid = getUUID();
		editGroupUserSub = PubSub.subscribe(uuid, (_, {error})=>{
			setLoading(false);
			if (error) {
				Modal.error({title: 'ftp共享数据编辑错误', content: error.reason})
			}
			else {
				notification.success({message: 'ftp共享编辑成功'});
				getFtp();
				setOpen(false)
			}
		})
		WebSocketService.call(uuid, URL.SHARE_FTP_UPDATE, [values['id'], temp]);
	}

	// 删除ftp共享
	const del = r => {
		setRecord(r);
		setDelOpen(true);;
	}

	// 确认删除
	const confirmDel = () => {
		setLoading(true);
		PubSub.unsubscribe(groupItemSub);
		let uuid = getUUID();
		groupItemSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '数据获取错误', content: error.reason})
			}
			else {
				// delGroup(result[0]);
				delUserHome(result[0]);
			}
		})
		WebSocketService.call(uuid, URL.GROUP_QUERY, [[["gid", "=", record['group_id']]]]);
	}

	// 将组内用户主目录指向 /nonexistent
	const delUserHome = (group) => {
		PubSub.unsubscribe(editUser);
		index = 0
		let uuid = getUUID();
		editUser = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '删除错误', content: error.reason})
			}
			else {
				index++;
				if (group['users'].length<=index) {
					delGroup(group['id'])
				}
			}
		})
		for (let k in group['users']) {
			WebSocketService.call(uuid, URL.USER_EDIT, [group['users'][k], {home: '/nonexistent'}]);
		}
	}

	// 删除组 delGroupSub
	const delGroup = id => {
		let uuid = getUUID();
		delGroupSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: '用户组删除失败', content: error.reason})
			}
			else {
				delFtp()
			}
		})
		WebSocketService.call(uuid, URL.GROUP_DELETE, [id, {}]);
	}

	// 删除ftp共享
	const delFtp = () => {
		let uuid = getUUID();
		ftpDelete = PubSub.subscribe(uuid, (_, {error})=>{
			setLoading(false);
			if (error) {
				Modal.error({title: 'ftp共享删除错误', content: error.reason})
			}
			else {
				notification.success({message: 'ftp共享删除成功'});
				getFtp();
				setDelOpen(false);
			}
		})
		WebSocketService.call(uuid, URL.SHARE_FTP_DELETE, [record.id]);
	}

	// 提交数据保存
	const handleSubmit = values => {
		for (let k in bandwidthList) {
			let flag = 1
			if (values[bandwidthList[k]] && values[bandwidthList[k]]>0) {
				if (!isEmpty(values[bandwidthList[k]+'-suffix'])) flag = values[bandwidthList[k]+'-suffix']
				values[bandwidthList[k]] *= Math.pow(1024, flag);
				delete values[bandwidthList[k]+'-suffix']
			}
			else {
				delete values[bandwidthList[k]]
				delete values[bandwidthList[k]+'-suffix']
			}
		}
		submitData = values;
		setTitle("");
		setEditOpen(true);
	}

	// 确认编辑数据保存
	const confirmSubmit = () => {
		setLoading(true);
		// 允许匿名用户登录 先 查询内置用户ftp的uid 增加一条用户为ftp的共享配置
		if (submitData['onlyanonymous']) {
			let uuid = getUUID();
			ftpUidSub = PubSub.subscribe(uuid, (_, {result, error})=>{
				if (error) {
					setLoading(false);
					notification.error({message: '内置FTP用户获取失败，请稍后重试！'});
				}
				else {
					let temp = submitData
					temp['ftp_path'] = temp['anonpath']
					getAclState(temp, result[0]['uid'])
				}
			})
			WebSocketService.call(uuid, URL.USER_QUERY, [[['username', '=', 'ftp']]]);
		}
		else {
			save();
		}
	}

	// 设置匿名读写权限
	const setFtpAnon = (values, uid, aclInfo, aclAuth) => {
		let perms = {READ: false, WRITE: false, EXECUTE: false}
		if (values['anonAuth']+'' === '5') {
			perms = {READ: true, WRITE: false, EXECUTE: true}
		}
		else if (values['anonAuth']+'' === '7') {
			perms = {READ: true, WRITE: true, EXECUTE: true}
		}
		let dacl = aclAuth
		dacl.push({tag: 'USER', default: false, perms, id: uid})

		let param = {}
		param['acltype'] = aclInfo['acltype']
		param['gid'] = aclInfo['gid']
		param['uid'] = aclInfo['uid']
		param['path'] = aclInfo['path']
		param['options'] = {recursive: false, traverse: false}
		param['dacl'] = dacl;

		PubSub.unsubscribe(setAclSub);
		let uuid = getUUID();
		setAclSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				setLoading(false);
				Modal.error({title: 'FTP匿名权限设置错误', content: error.reason})
			}
			else {
				save();
			}
		})
		WebSocketService.call(uuid, URL.FILE_ACL_SET, [param]);
	}

	// 保存数据
	const save = () => {
		let temp = submitData;
		delete temp['anonAuth']
		delete temp['ftp_path']
		let uuid = getUUID();
		updateSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			setLoading(false);
			if (error) {
				notification.error({message: 'FTP共享设置错误'});
			}
			else {
				notification.success({message: 'FTP共享设置成功'});
				navigate('/share/protocol');
			}
		})
		WebSocketService.call(uuid, URL.FTP_UPDATE, [submitData]);
	}

	// form数据变化
	const onDataChange = (changedValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'onlyanonymous') {
			setAnonymous(changedValues[changeKey])
		}
		else if (changeKey === 'onlylocal') {
			setLocal(changedValues[changeKey])
		}
	}

	// columns
	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '12%',
			render: (t,r,i)=>i+1
		},
		{
			title: 'ftp共享目录',
			dataIndex: 'path',
			width: '34%'
		},
		{
			title: 'ftp组',
			dataIndex: 'group_name',
			width: '20%'
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '34%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{view(r)}}>查看</Button>
						<Button type={'link'} size={'small'} onClick={()=>{edit(r)}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={()=>{del(r)}}>删除</Button>
					</Row>
				)
			}
		},
	]

	//
	const suffixSelector = (key) => {
		return (
			<Form.Item name={key+'-suffix'} noStyle>
				<Select style={{width: 70}} defaultValue={1} options={options}/>
			</Form.Item>
		)
	};

	const groupNameUse = (_, value) => {
		if (!isEmpty(value) && groupList.includes(value)) {
			return Promise.reject();
		}
		return Promise.resolve();
	}

	const groupNameHead = (_, value) => {
		const reg = /^ftp/
		if (isEmpty(value) || reg.test(value)) {
			return Promise.resolve();
		}
		return Promise.reject();
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>FTP设置</Row>
			<Row className={'sub-title'}>修改系统的FTP设置</Row>
			<Row className={'actions'} />
			<Row type={'flex'} style={{width: '770px'}}>
				<Form
					labelCol={{span: 10,}}
					wrapperCol={{span: 13,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 750}}
					form={form}
					onFinish={handleSubmit}
					onValuesChange={onDataChange}
				>
					<Row type={'flex'}>
						<Col span={12}>
							<Form.Item label="端口" name={'port'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'设置FTP服务监听的端口。'}>
								<InputNumber style={{width: '100%'}}/>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="登录尝试" name={'loginattempt'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'输入客户端断开连接之前的最大尝试次数。如果用户容易出现错字，请增加此值。'}>
								<InputNumber style={{width: '100%'}}/>
							</Form.Item>
						</Col>
					</Row>
					<Row type={'flex'}>
						<Col span={12}>
							<Form.Item label="客户端数量" name={'clients'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'并发客户端的最大数量。'}>
								<InputNumber style={{width: '100%'}}/>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="无传输超时" name={'timeout_notransfer'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'无发送/接收文件，或接收目录列表命令时，允许客户端连接的最大秒数。'}>
								<InputNumber style={{width: '100%'}}/>
							</Form.Item>
						</Col>
					</Row>
					<Row type={'flex'}>
						<Col span={12}>
							<Form.Item label="链接" name={'ipconnections'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'设置每个IP地址最大并发连接数。0表示无限制。'}>
								<InputNumber style={{width: '100%'}}/>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="超时" name={'timeout'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'无控制或数据连接命令时，允许客户端连接的最大秒数。'}>
								<InputNumber style={{width: '100%'}}/>
							</Form.Item>
						</Col>
					</Row>
					<Row type={'flex'}>
						<Col span={12}>
							<Form.Item label="本地用户上传带宽" name={'localuserbw'}>
								<InputNumber addonAfter={suffixSelector('localuserbw')}/>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="本地用户下载带宽" name={'localuserdlbw'}>
								<InputNumber addonAfter={suffixSelector('localuserdlbw')}/>
							</Form.Item>
						</Col>
					</Row>
					<Row type={'flex'}>
						<Col span={12}>
							<Form.Item label="允许匿名登录" name={'onlyanonymous'} valuePropName={'checked'} tooltip={'允许匿名FTP登录名访问路径中指定的目录。'}>
								<Checkbox />
							</Form.Item>
						</Col>
					</Row>
					{
						anonymous?(
							<>
								<Row type={'flex'}>
									<Col span={12}>
										<Form.Item label="路径" name={'anonpath'} rules={[{ required: true, message: '请填写路径！' }]} tooltip={'设置匿名FTP连接的根目录。'}>
											<TreeSelect treeData={treeData} style={{width: '577px'}} treeDefaultExpandAll/>
										</Form.Item>
									</Col>
								</Row>
								<Row type={'flex'}>
									<Col span={12}>
										<Form.Item label="匿名访问权限" name={'anonAuth'} rules={[{ required: true, message: '请选择匿名访问权限！' }]} tooltip={'设置匿名FTP访问权限。'}>
											<Radio.Group>
												<Radio value={5}>只读</Radio>
												<Radio value={7}>读写</Radio>
											</Radio.Group>
										</Form.Item>
									</Col>
								</Row>
								<Row type={'flex'}>
									<Col span={12}>
										<Form.Item label="匿名用户上传带宽" name={'anonuserbw'}>
											<InputNumber addonAfter={suffixSelector('anonuserbw')}/>
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item label="匿名用户下载带宽" name={'anonuserdlbw'}>
											<InputNumber addonAfter={suffixSelector('anonuserdlbw')}/>
										</Form.Item>
									</Col>
								</Row>
							</>

						):""
					}
					<Row type={'flex'}>
						<Col span={12}>
							<Form.Item label="允许本地用户登录" name={'onlylocal'} valuePropName={'checked'} tooltip={'允许任何本地用户登录。未勾选时，仅允许ftp组的成员登录。'}>
								<Checkbox />
							</Form.Item>
						</Col>
					</Row>
					{
						local?(
							<Row type={'flex'} style={{marginBottom: '2vh'}}>
								<Col span={5} />
								<Col span={18}>
									<Table
										pagination={false}
										footer={() => <Row type={'flex'} justify={'center'} style={{cursor: 'pointer'}} onClick={add}><PlusOutlined style={{fontSize: '18px'}} /></Row>}
										columns={columns}
										dataSource={ftpList}
									/>
								</Col>
							</Row>
						):''
					}
					<Form.Item {...tailFormItemLayout(5)}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/share/protocol')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>

			<Modal
				title={title}
				open={open}
				onCancel={()=>{setOpen(false)}}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={()=>{setOpen(false)}}>关闭</Button>
						{
							title==='查看ftp共享'?'':(
								<Button type={'primary'} onClick={confirmSave} loading={loading}>保存</Button>
							)
						}
					</Row>
				)}
			>
				<Form
					labelCol={{span: 6,}}
					wrapperCol={{span: 18,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: '100%', marginTop: '4vh'}}
					form={groupForm}
				>
					<Form.Item
						label="ftp组名称" name={'ftp_group_name'} tooltip={'ftp组名称需以“ftp”为开头'}
						rules={title==='添加ftp共享'?[
							{ required: true, message: '请填写ftp组名称！' },
							{ validator: groupNameHead, message: 'ftp组名称需以“ftp”为开头' },
							{ validator: groupNameUse, message: '该群组名称已被使用' },
						]:[]}
					>
						{
							title!=='添加ftp共享'?record['group_name']:(
								<Input />
							)
						}
					</Form.Item>
					<Form.Item label="ftp组ID" name={'ftp_group_id'} rules={title==='添加ftp共享'?[{ required: true, message: '请填写ftp组ID！' }]:[]}>
						{
							title!=='添加ftp共享'?record['group_id']:(
								<InputNumber style={{width: '100%'}} min={1}/>
							)
						}
					</Form.Item>
					<Form.Item label="ftp组成员" name={'user'} rules={[{ required: true, message: '请选择ftp组成员！' }]}>
						{
							title==='查看ftp共享'?record['users']:(
								<Select options={user} mode="multiple"/>
							)
						}
					</Form.Item>
					<Form.Item label="ftp组访问路径" name={'ftp_path'} rules={title==='添加ftp共享'?[{ required: true, message: '请选择ftp组访问路径！' }]:[]}>
						{
							title!=='添加ftp共享'?record['path']:(
								<Select options={path}/>
							)
						}
					</Form.Item>
					<Form.Item label="ftp组访问权限" name={'group_permission'} rules={[{ required: true, message: '请选择ftp组访问权限！' }]}>
						<Radio.Group disabled={title==='查看ftp共享'}>
							<Radio value={5}>只读</Radio>
							<Radio value={7}>读写</Radio>
						</Radio.Group>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title={'确认删除'}
				open={delOpen}
				onCancel={()=>{setDelOpen(false)}}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={()=>{setDelOpen(false)}}>取消</Button>
						<Button type={'primary'} onClick={confirmDel} loading={loading}>确认</Button>
					</Row>
				)}
			>
				是否确认删除ftp组 {record['group_name']} 及其共享权限
			</Modal>
			<Modal
				title={'确认操作'}
				open={editOpen}
				onCancel={()=>{setEditOpen(false)}}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={()=>{setEditOpen(false)}}>取消</Button>
						<Button type={'primary'} onClick={confirmSubmit} loading={loading}>确认</Button>
					</Row>
				)}
			>
				确认保存FTP配置修改
			</Modal>
		</div>
	);
}

export default Ftp;
