import React, { useEffect, useRef } from 'react';
import { Row, Button, notification, Modal } from 'antd'
import { useNavigate } from "react-router-dom";
import BaseTablePage from "../../../component/TablePage";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID } from "../../../utils/cmn";
import PubSub from "pubsub-js";

let deleteSub = null;


function User() {
	const navigate = useNavigate();
	const cRef = useRef(null)

	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {
			PubSub.unsubscribe(deleteSub);
		}
	}, []);

	const deleteConfirm = record => {
		const next = () => {
			if (WebSocketService) {
				const uuid = getUUID();
				deleteSub = PubSub.subscribe(uuid, (_, result)=>{
					if (result && result>0) {
						notification.success({message: '删除用户', description: '删除NAS用户成功'});
						cRef.current.fetchData(URL.USER_QUERY)
					}
				})
				WebSocketService.call(uuid, URL.USER_DELETE, [record.id, {delete_group: false}]);
			}
		}
		if (record && record['builtin']) {
			notification.warning({message: '无法删除', description: '该用户为内建用户，无法删除'})
		}
		else {
			Modal.confirm({
				title: '删除用户',
				content: `您确定要删除用户 ${record.username} 吗？`,
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
			title: '用户名',
			dataIndex: 'username',
			width: '23%',
		},
		{
			title: 'UID',
			dataIndex: 'uid',
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
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/credentials/users/edit?id='+r.id)}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={()=>{deleteConfirm(r)}}>删除</Button>
					</Row>
				)
			}
		},
	];

	const actions = <Button type={'primary'} onClick={()=>{navigate('/credentials/users/create')}}>新建</Button>

	const filters = item => {
		return !item['builtin'] || item['username'] === 'root';
	}

	return (
		<BaseTablePage
			ref={cRef}
			title={'NAS用户'}
			subTitle={'进行NAS用户的新建，修改，删除'}
			url={URL.USER_QUERY}
			columns={columns}
			actions={actions}
			filters={filters}
		/>
	);
}

export default User;
