import React, { useEffect, useRef } from 'react';
import { Row, Button, notification, Modal } from 'antd'
import { useNavigate } from "react-router-dom";
import BaseTablePage from "../../../component/TablePage";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID } from "../../../utils/cmn";
import PubSub from "pubsub-js";

let deleteSub = null;


function Group() {
	const navigate = useNavigate();
	const cRef = useRef(null)

	// componentDidMount componentWillUnmount
	useEffect(() => {

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
				content: `您确定要删除群组 ${record.group} 吗？`,
				onOk: next,
			})
		}
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
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/credentials/groups/member?id='+r.id)}}>成员</Button>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/credentials/groups/edit?id='+r.id)}}>编辑</Button>
						<Button type={'link'} size={'small'} onClick={()=>{deleteConfirm(r)}}>删除</Button>
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
