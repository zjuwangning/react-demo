import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, Modal, notification, Table, Tooltip } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let delSub = null,
	datasetSub = null,  // 获取所有数据集
	ftpQuery = null,    // 获取要删除的共享文件的ftp共享信息
	groupItemSub = null,    // 获取组信息
	editUser = null,        // 编辑组内成员
	delGroupSub = null,     // 删除组
	ftpDelete = null,       // 删除ftp共享
	shareSub = null;    // 获取所有数据集共享数据

let dataset = [], shareInfo = null;


function ShareFiles() {
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 数据集列表
	const [loading, setLoading] = useState(false);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 10,
		},
	});

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();

		return () => {
			PubSub.unsubscribe(delSub);
			PubSub.unsubscribe(ftpQuery);
			PubSub.unsubscribe(datasetSub);
			PubSub.unsubscribe(groupItemSub);
			PubSub.unsubscribe(editUser);
			PubSub.unsubscribe(delGroupSub);
			PubSub.unsubscribe(ftpDelete);
			PubSub.unsubscribe(shareSub);
		}
	}, []);

	// 获取所有数据集 及 数据集共享情况
	const getData = () => {
		setLoading(true);
		dataset = [];
		shareInfo = null;

		let uuid = getUUID();
		shareSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
				setLoading(false);
				// setData([]);
			}
			else {
				if (!isEmpty(dataset)) {
					generateData(dataset, result);
				}
				else {
					shareInfo = result
				}
			}
		})
		WebSocketService.call(uuid, URL.DATASET_SHARE);

		uuid = getUUID();
		datasetSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
				setLoading(false);
				setData([]);
			}
			else {
				generateData(result, {});
				if (!isEmpty(shareInfo)) {
					generateData(result, shareInfo);
				}
				else {
					dataset = result
				}
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[], {extra: {properties: ['used', 'available', 'mountpoint', 'compression', 'compressratio', 'creation']}}]);
	}

	// 表格数据重组
	const generateData = (set, info) => {
		let temp = [];
		for (let k in set) {
			if (filters(set[k])) {
				temp.push(Object.assign(set[k], {share: info[set[k]['id']] || {}}))
			}
		}
		temp.sort(function (a, b) {
			return b['creation']['parsed']['$date'] - a['creation']['parsed']['$date']
		})
		setLoading(false);
		setData(temp);
	}

	//
	const deleteDataset = r => {
		Modal.confirm({
			title: '确认操作',
			content: '是否确认删除 '+r['id'],
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					delSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						if (error) {
							Modal.error({title: '删除失败', content: error.reason})
						}
						else {
							notification.success({message: '删除成功'});
							getData();
							if (r && r['mountpoint']) {
								getFtp(r['mountpoint']);
							}
						}
						resolve();
					})
					WebSocketService.call(uuid, URL.DATASET_DELETE, [r['id'], {recursive: true}]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	// 共享文件删除成功后 获取ftp共享数据 看是否需要删除对应的ftp共享数据
	const getFtp = path => {
		let uuid = getUUID();
		ftpQuery = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: 'FTP共享数据获取错误'});
			}
			else {
				if (result && result.length>0) {
					// 根据group_id获取组信息
					let gid = [], fid = [];
					for (let k in result) {
						if (result[k] && result[k]['id'] && result[k]['group_id'] ){
							fid.push(result[k]['id'])
							gid.push(result[k]['group_id'])
						}
					}
					getGroup(fid, gid)
				}
			}
		})
		WebSocketService.call(uuid, URL.SHARE_FTP_QUERY, [[['path', '=', path]]]);
	}

	// 获取组信息 整理ftp共享组id和组内成员id
	const getGroup = (fid, gid) => {
		PubSub.unsubscribe(groupItemSub);
		let uuid = getUUID();
		groupItemSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				Modal.error({title: '共享文件的ftp共享删除错误，请到FTP共享协议设置页面查看。', content: error.reason})
			}
			else {
				if ( result ) {
					let uid = [], group = []
					for (let k in result) {
						if (result[k] && result[k]['users']){
							group.push(result[k]['id'])
							uid = uid.concat(result[k]['users'])
						}
					}
					delUserHome(uid, group, fid);
				}
			}
		})
		WebSocketService.call(uuid, URL.GROUP_QUERY, [[["gid", "in", gid]]]);
	}

	// 将所有组内用户主目录指向 /nonexistent
	const delUserHome = (uid, gid, fid) => {
		PubSub.unsubscribe(editUser);
		let index = 0
		let uuid = getUUID();
		editUser = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				Modal.error({title: '共享文件的ftp共享删除错误，请到FTP共享协议设置页面查看。', content: error.reason})
			}
			else {
				index++;
				if (uid.length<=index) {
					delGroup(gid, fid)
				}
			}
		})
		for (let k in uid) {
			WebSocketService.call(uuid, URL.USER_EDIT, [uid[k], {home: '/nonexistent'}]);
		}
	}

	// 删除组 delGroupSub
	const delGroup = (gid, fid) => {
		PubSub.unsubscribe(delGroupSub);
		let index = 0
		let uuid = getUUID();
		delGroupSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				Modal.error({title: '共享文件的ftp共享删除错误，请到FTP共享协议设置页面查看。', content: error.reason})
			}
			else {
				index++;
				if (gid.length<=index) {
					delFtp(fid)
				}
			}
		})
		for (let k in gid) {
			WebSocketService.call(uuid, URL.GROUP_DELETE, [gid[k], {}]);
		}
	}

	// 删除ftp共享
	const delFtp = (fid) => {
		PubSub.unsubscribe(ftpDelete);
		let uuid = getUUID();
		ftpDelete = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				Modal.error({title: '共享文件的ftp共享删除错误，请到FTP共享协议设置页面查看。', content: error.reason})
			}
		})
		for (let k in fid) {
			WebSocketService.call(uuid, URL.SHARE_FTP_DELETE, [fid[k]]);
		}
	}

	//
	const handleTableChange = (pagination, filters, sorter) => {
		if (pagination.pageSize !== tableParams.pagination?.pageSize) {
			pagination.current = 1;
		}
		setTableParams({
			pagination,
			filters,
			...sorter,
		});
	};

	const nfs = r => {
		if (r && r['share'] && r['share']['nfs'] !== undefined && r['share']['nfs'] !== false) {
			navigate('/share/files/nfs-auth?id='+r['share']['nfs'])
		}
		else {
			if (r['share']['nfs'] === undefined) {
				notification.warning({message: '共享协议获取中'})
			}
			else if (r['share']['nfs'] === false) {
				notification.warning({message: '该文件未配置nfs共享'})
			}
		}
	}

	const smb = r => {
		if (r && r['share'] && r['share']['smb'] !== undefined && r['share']['smb'] !== false) {
			navigate('/share/files/smb-auth?path='+r['mountpoint']);
		}
		else {
			if (r['share']['smb'] === undefined) {
				notification.warning({message: '共享协议获取中'})
			}
			else if (r['share']['smb'] === false) {
				notification.warning({message: '该文件未配置smb共享'})
			}
		}
	}

	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '5%',
			render: (t,r,i)=>i+1
		},
		{
			title: '共享文件名称',
			dataIndex: 'name',
			width: '15%',
			ellipsis: {
				showTitle: false,
			},
			render: (t, r) => (
				<Tooltip placement="topLeft" title={t.slice(r['pool'].length+1)}>
					{t.slice(r['pool'].length+1)}
				</Tooltip>
			),
		},
		{
			title: '共享文件协议类型',
			dataIndex: 'share',
			width: '13%',
			render: t => {
				let temp = '';
				for (let k in t) {
					if (t[k] !== false) temp += k+'+'
				}
				if (temp.length>0) temp = temp.slice(0, temp.length-1);
				return temp
			}
		},
		{
			title: '存储池名',
			dataIndex: 'pool',
			width: '10%',
		},
		{
			title: '已用容量',
			dataIndex: 'used',
			width: '8%',
			render: t=>t['value']
		},
		{
			title: '可用容量',
			dataIndex: 'available',
			width: '8%',
			render: t=>t['value']
		},
		{
			title: '压缩',
			dataIndex: 'compression',
			width: '8%',
			render: t=>{
				if (t['value'] === 'OFF') return '禁用';
				return t['value']
			}
		},
		{
			title: '压缩率',
			dataIndex: 'compressratio',
			width: '8%',
			render: t=>t['parsed']
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '25%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/share/files/details?id='+r['id'])}}>查看</Button>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/share/files/edit?id='+r['id'])}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={()=>{deleteDataset(r)}}>删除</Button>
						<Button type={'link'} size={'small'} onClick={()=>{nfs(r)}}>nfs授权</Button>
						<Button type={'link'} size={'small'} onClick={()=>{smb(r)}}>smb授权</Button>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/share/files/snapshot?id='+r['id'])}}>快照</Button>
					</Row>
				)
			}
		},
	];

	const actions = <Button type={'primary'} onClick={()=>{navigate('/share/files/create')}}>新建</Button>

	const filters = item => {
		return item['id'].indexOf('/')>0;
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>共享文件</Row>
			<Row className={'sub-title'}>显示所有共享文件的基本信息，创建、修改、删除不同协议（SMB/NFS/FTP/WEBDAV）的共享文件。</Row>
			<Row className={'actions'}>{actions}</Row>
			<Table
				size={'middle'}
				columns={columns}
				rowKey={(record) => record.id || record.name}
				dataSource={data}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				childrenColumnName={'notallow'}
			/>
		</div>
	);
}

export default ShareFiles;
