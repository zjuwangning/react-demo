import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
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
	runSub = null,
	intervalSub = null,
	editSub = null;

let timer = null;


function Rsync() {
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
			PubSub.unsubscribe(runSub);
			PubSub.unsubscribe(intervalSub);
			PubSub.unsubscribe(editSub);
			if (timer !== null) {
				clearInterval(timer)
			}
		}
	}, []);

	// 获取任务列表
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
				getInterval();
			}
		})
		WebSocketService.call(uuid, URL.RSYNC_TASK_QUERY);
	}

	// 轮询更新页面数据
	const getInterval = () => {
		intervalSub = PubSub.subscribe('interval', (_, {result, error})=>{
			if (error) {

			}
			else {
				setTask(result);
			}
		})

		if (timer !== null) {
			clearInterval(timer)
		}
		timer = setInterval(()=>{
			WebSocketService.call('interval', URL.RSYNC_TASK_QUERY);
		}, 4000)
	}

		//
	const onDelete = r => {
		Modal.confirm({
			title: '确认操作',
			content: `确认删除同步任务 ${r['remotehost']} - ${r['remotemodule']}`,
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					delSub = PubSub.subscribe(uuid, (_, result, error)=>{
						if (error) {
							Modal.error({title: '删除错误', content: error.reason})
						}
						else {
							notification.success({message: '删除成功'});
							getData();
						}
						resolve();
					})
					WebSocketService.call(uuid, URL.RSYNC_TASK_DELETE, [r['id']]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	// 立即运行
	const runNow = r => {
		Modal.confirm({
			title: '立即运行',
			content: `是否立即运行一次同步任务`,
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					runSub = PubSub.subscribe(uuid, (_, result, error)=>{
						if (error) {
							Modal.error({title: '运行错误', content: error.reason})
						}
						else {
							notification.success({message: '任务运行命令下发成功'});
							getData();
						}
						resolve();
					})
					WebSocketService.call(uuid, URL.RSYNC_TASK_RUN, [r['id']]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
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

	//
	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '4%',
			render: (t,r,i)=>i+1
		},
		{
			title: '路径',
			dataIndex: 'path',
			width: '10%',
		},
		{
			title: '远程主机',
			dataIndex: 'remotehost',
			width: '12%',
		},
		{
			title: '远程模块名',
			dataIndex: 'remotemodule',
			width: '8%',
		},
		{
			title: '下次运行',
			dataIndex: 'schedule',
			width: '11%',
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
			width: '24%',
			render: t => {
				if (t) {
					let str = `${t.minute} ${t.hour} ${t.dom} ${t.month} ${t.dow}`
					return `${cronstrue.toString(str, {verbose: true, locale: 'en'})}`
				}
			}
		},
		{
			title: '用户',
			dataIndex: 'user',
			width: '6%',
		},
		{
			title: '状态',
			dataIndex: 'job',
			width: '10%',
			render: t=>{
				if (t === null) {
					return 'PENDING'
				}
				else {
					return t['state']
				}
			}
		},
		{
			title: '操作',
			dataIndex: 'enabled',
			width: '15%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/task/rsync-task/edit?id='+r['id'])}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={(e)=>{e.stopPropagation();onDelete(r)}}>删除</Button>
						<Button type={'link'} size={'small'} onClick={(e)=>{e.stopPropagation();runNow(r)}}>立即运行</Button>
					</Row>
				)
			}
		},
	]

	return (
		<div className={'full-page'}>
			<Row className={'title'}>同步任务</Row>
			<Row className={'sub-title'}>创建，删除，开启或关闭存储池及共享文件的Rsync同步任务</Row>
			<Row className={'actions'}>
				<Button type={'primary'} onClick={()=>{navigate('/task/rsync-task/create')}}>创建同步任务</Button>
			</Row>
			<Table
				size={'middle'}
				columns={columns}
				rowKey={(record) => record.id || record.serial}
				dataSource={taskList}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				expandable={{
					expandedRowRender: (record) => (
						<div>
							<Row>方向：{record['direction']}</Row>
							<Row>启用状态：{record['enabled']?'已启用':'已停用'}</Row>
							<Row>延迟更新：{record['delayupdates']?'是':'否'}</Row>
						</div>
					),
					expandRowByClick: true,
				}}
			/>
		</div>
	);
}

export default Rsync;
