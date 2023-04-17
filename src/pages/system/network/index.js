import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, Modal, notification, Table } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let networkSub = null;

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
			PubSub.unsubscribe(networkSub);
		}
	}, []);

	// 获取所有数据集 及 数据集共享情况
	const getData = () => {
		setLoading(true);
		let uuid = getUUID();
		networkSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
				setLoading(false);
			}
			else {
				console.log('result', result);
				setLoading(false);
				setData(result)
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_QUERY);
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

	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '5%',
			render: (t,r,i)=>i+1
		},
		{
			title: '网卡',
			dataIndex: 'name',
			width: '10%',
		},
		{
			title: '状态',
			dataIndex: 'state',
			width: '10%',
			render: t => t&&t['link_state']&&t['link_state']==='LINK_STATE_UP'?'RUNNING':'N/A'
		},
		{
			title: 'IP',
			dataIndex: 'aliases',
			width: '15%',
			render: t => t&&t.length>0?t[0]['address']:''
		},
		{
			title: '子网掩码',
			dataIndex: 'aliases',
			width: '10%',
			render: t => t&&t.length>0?t[0]['netmask']:''
		},
		{
			title: '支持速度',
			dataIndex: 'state',
			width: '10%',
			render: t => t&&t['supported_media']&&t['supported_media'].length>0?t['supported_media'][0]:''
		},
		{
			title: '当前速度',
			dataIndex: 'state',
			width: '10%',
			render: t => t&&t['active_media_subtype']?t['active_media_subtype']:''
		},
		{
			title: 'MTU',
			dataIndex: 'state',
			width: '10%',
			render: t => t&&t['mtu']?t['mtu']:''
		},
		{
			title: '绑定模式',
			dataIndex: 'type',
			width: '10%',
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '10%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/share/files/details?id='+r['id'])}}>配置</Button>
					</Row>
				)
			}
		},
	];

	return (
		<div className={'full-page'}>
			<Row className={'title'}>网络管理</Row>
			<Row className={'sub-title'}>进行网络的配置和修改</Row>
			<Row className={'actions'}>
				<Button type={'primary'} onClick={()=>{navigate('/system/network/global-config')}}>全局配置</Button>
				<Button type={'primary'} style={{marginLeft: '20px'}} onClick={()=>{navigate('/system/network/bond')}}>绑定</Button>
			</Row>
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
