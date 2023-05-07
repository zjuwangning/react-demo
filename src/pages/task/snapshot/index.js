import React, { useEffect, useState } from 'react';
import {useNavigate} from "react-router-dom";
import { Row, Modal, notification, Button, Table, Switch } from "antd";
import PubSub from "pubsub-js";
import cronstrue from 'cronstrue';
import * as cronParser from 'cron-parser';
import dayjs from 'dayjs'
import { URL } from "../../../server/enum";
import { getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let taskSub = null,
	delSub = null,
	editSub = null;


function Snapshot() {
	const navigate = useNavigate();

	const [taskList, setTask] = useState([]);
	const [loading, setLoading] = useState(false);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 10,
		},
	});


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			getData();
		}

		return () => {
			PubSub.unsubscribe(taskSub);
			PubSub.unsubscribe(delSub);
			PubSub.unsubscribe(editSub);
		}
	}, []);

	// 获取快照列表
	const getData = () => {
		setLoading(true);
		let uuid = getUUID();
		taskSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
				setLoading(false);
			}
			else {
				setTask(result);
				setLoading(false);
			}
		})
		WebSocketService.call(uuid, URL.SNAP_TASK_QUERY);
	}

	//
	const onDelete = r => {
		Modal.confirm({
			title: '确认操作',
			content: (
				<div>
					<Row>是否确认删除定期快照任务</Row>
					<Row>{r['dataset']} {r['naming_schema']}</Row>
				</div>
			),
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					delSub = PubSub.subscribe(uuid, (_, result, error)=>{resolve();
						if (error) {
							notification.error({message: '删除失败'});
						}
						else {
							notification.success({message: '删除成功'});
							getData();
						}
					})
					WebSocketService.call(uuid, URL.SNAP_TASK_DELETE, [r['id']]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	//
	const onChangeEnabled = (r, enabled) => {
		setLoading(true);
		let uuid = getUUID();
		editSub = PubSub.subscribe(uuid, (_, {error})=>{
			if (error) {
				notification.error({message: '数据修改失败，请稍后重试'})
				setLoading(false);
			}
			else {
				getData();
			}
		})
		WebSocketService.call(uuid, URL.SNAP_TASK_UPDATE, [r['id'], {enabled}]);
	}

	//
	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			...sorter,
		});

		if (pagination.pageSize !== tableParams.pagination?.pageSize) {
			setTask([]);
		}
	};

	//
	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '5%',
			render: (t,r,i)=>i+1
		},
		{
			title: '目录名称',
			dataIndex: 'dataset',
			width: '13%'
		},
		{
			title: '下次运行',
			dataIndex: 'schedule',
			width: '10%',
			render: (t, r) => {
				let str = `${t.minute} ${t.hour} ${t.dom} ${t.month} ${t.dow}`
				const schedule = cronParser.parseExpression(str, );
				const temp = schedule.next()['_date']['ts']
				return dayjs(temp).format('YYYY-MM-DD HH:mm')
			}
		},
		{
			title: '时间设置',
			dataIndex: 'schedule',
			width: '45%',
			render: t => {
				if (t) {
					let str = `${t.minute} ${t.hour} ${t.dom} ${t.month} ${t.dow}`
					// return `${t.begin}-${t.end }, ${cronstrue.toString(str, {verbose: true, locale: 'zh-hans'})}`
					return `${cronstrue.toString(str, {verbose: true, locale: 'zh-hans'})}`
				}
			}
		},
		{
			title: '状态',
			dataIndex: 'state',
			width: '9%',
			render: t=> t?t.state:''
		},
		{
			title: '操作',
			dataIndex: 'enabled',
			width: '16%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/task/snapshot-task/edit?id='+r['id'])}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={()=>{onDelete(r)}}>删除</Button>
						<Switch
							style={{marginLeft: '0.5vw'}} checkedChildren="开启" unCheckedChildren="关闭"
							checked={t}
							onClick={checked=>{onChangeEnabled(r, checked)}}
						/>
					</Row>
				)
			}
		},
	]

	return (
		<div className={'full-page'}>
			<Row className={'title'}>定期快照</Row>
			<Row className={'sub-title'}>查看，创建，删除，开启或关闭定期快照任务</Row>
			<Row className={'actions'}>
				<Button type={'primary'} onClick={()=>{navigate('/task/snapshot-task/create')}}>创建定期快照</Button>
			</Row>
			<Table
				size={'middle'}
				columns={columns}
				rowKey={(record) => record.id || record.serial}
				dataSource={taskList}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
			/>
		</div>
	);
}

export default Snapshot;
