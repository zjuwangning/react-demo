import React, { useEffect, useRef } from 'react';
import { Row, Button, notification, Modal } from 'antd'
import { useNavigate } from "react-router-dom";
import BaseTablePage from "../../../component/TablePage";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID } from "../../../utils/cmn";
import PubSub from "pubsub-js";

let deleteSub = null, ftpQuery = null;


function Group() {
	const navigate = useNavigate();
	const cRef = useRef(null)

	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {
			PubSub.unsubscribe(deleteSub);
			PubSub.unsubscribe(ftpQuery);
		}
	}, []);

	const deleteConfirm = record => {
		const next = () => {
			cRef.current.setTableLoading(true);
			if (WebSocketService) {
				const uuid = getUUID();
				deleteSub = PubSub.subscribe(uuid, (_, {result})=>{
					if (result && result>0) {
						notification.success({message: '删除群组', description: '删除NAS群组成功'});
						cRef.current.fetchData(URL.GROUP_QUERY)
					}
					else {
						cRef.current.setTableLoading(false);
					}
				})
				WebSocketService.call(uuid, URL.GROUP_DELETE, [record.id, {}]);
			}
		}
		if (record && record['builtin']) {
			notification.warning({message: '无法删除', description: '该群组为内建群组，无法删除'})
		}
		else {
			Modal.confirm({
				title: '删除群组',
				content: `确定删除群组 ${record.group} 吗？`,
				onOk: next,
			})
		}
	}

	// 查询FTP共享 看要删除的组是否为FTP共享组
	const getFtp = (record, method) => {
		let uuid = getUUID();
		ftpQuery = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: 'FTP共享数据获取错误'});
			}
			else {
				let flag = false;
				if (result && result.length>0) {
					for (let k in result) {
						if (result[k]['group_id'] === record['gid']) {
							flag = true;
							break;
						}
					}
				}
				if (flag) {
					let message = '该群组为FTP共享群组，群组信息不可在此处编辑。如需编辑成员，请在FTP共享协议设置页面操作。'
					if (method === 'delete') {
						message = '该群组为FTP共享群组，无法在此处进行删除操作。如需删除FTP共享，请在FTP共享协议设置页面操作，对应的FTP共享群组会同时删除。'
					}
					notification.error({message})
				}
				else {
					if (method === 'delete') {
						deleteConfirm(record)
					}
					else if (method === 'edit') {
						navigate('/credentials/groups/edit?id='+record.id)
					}
					else if (method === 'member') {
						navigate('/credentials/groups/member?id='+record.id)
					}
				}
			}
		})
		WebSocketService.call(uuid, URL.SHARE_FTP_QUERY);
	}

	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '8%',
			render: (t,r,i)=>i+1
		},
		{
			title: '群组名',
			dataIndex: 'group',
			width: '23%',
		},
		{
			title: 'GID',
			dataIndex: 'gid',
			width: '23%',
		},
		{
			title: '全名',
			dataIndex: 'full_name',
			width: '23%',
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '23%',
			render: (t,r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{getFtp(r, 'member')}}>成员</Button>
						<Button type={'link'} size={'small'} onClick={()=>{getFtp(r, 'edit')}}>编辑</Button>
						<Button type={'link'} size={'small'} onClick={()=>{getFtp(r, 'delete')}}>删除</Button>
					</Row>
				)
			}
		},
	];

	const actions = <Button type={'primary'} onClick={()=>{navigate('/credentials/groups/create')}}>新建</Button>

	const filters = item => {
		return !item['builtin'];
	}

	return (
		<BaseTablePage
			ref={cRef}
			title={'NAS群组'}
			subTitle={'进行NAS群组的新建，修改，删除'}
			url={URL.GROUP_QUERY}
			columns={columns}
			actions={actions}
			filters={filters}
		/>
	);
}

export default Group;
