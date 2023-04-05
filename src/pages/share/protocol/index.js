import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, Modal, notification, Table } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let fetchSub = null


function ShareProtocol() {
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
			PubSub.unsubscribe(fetchSub);
		}
	}, []);

	// 获取所有数据集 及 数据集共享情况
	const getData = () => {
		setLoading(true);
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			setLoading(false);
			setData(result);
		})
		WebSocketService.call(uuid, URL.SHARE_PROTOCOL);
	}

	const deleteDataset = r => {
		Modal.confirm({
			title: '确认操作',
			content: '是否确认删除 '+r['id'],
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					WebSocketService.call(uuid, URL.DATASET_DELETE, [r['id'], {recursive: true}]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			...sorter,
		});

		if (pagination.pageSize !== tableParams.pagination?.pageSize) {
			setData([]);
		}
	};

	const nfs = r => {
		if (r && r['share'] && r['share']['nfs'] !== false) {
			navigate('/share/files/nfs-auth?id='+r['share']['nfs'])
		}
		else {
			notification.warning({message: '该文件未配置nfs共享'})
		}
	}

	const smb = r => {
		if (r && r['share'] && r['share']['smb'] !== false) {
			navigate('/share/files/smb-auth?id='+r['share']['smb'])
		}
		else {
			notification.warning({message: '该文件未配置smb共享'})
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
			title: '协议名称',
			dataIndex: 'name',
			width: '18%',
		},
		{
			title: '状态',
			dataIndex: 'share',
			width: '14%',
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '35%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{deleteDataset(r)}}>启用</Button>
						<Button type={'link'} size={'small'} onClick={()=>{nfs(r)}}>禁用</Button>
						<Button type={'link'} size={'small'} onClick={()=>{smb(r)}}>设置</Button>
					</Row>
				)
			}
		},
	];

	const filters = item => {
		return item['id'].indexOf('/')>0;
	}


	return (
		<>
			<div className={'full-page'}>
				<Row className={'title'}>共享协议</Row>
				<Row className={'sub-title'}>查看协议状态，修改和启用/禁用协议。</Row>
				<Row className={'actions'} />
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
		</>
	);
}

export default ShareProtocol;
