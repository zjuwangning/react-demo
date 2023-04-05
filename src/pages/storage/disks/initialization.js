import React, {useEffect, useState} from 'react';
import {Button, Form, Row, Select, Progress, Col, Table, Modal} from 'antd'
import PubSub from "pubsub-js";
import { getUUID, isEmpty } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import { URL } from "../../../server/enum";
import { useNavigate, useSearchParams } from "react-router-dom";
import moment from "moment";

let diskSub = null,         // 获取硬盘基本信息
	jobListSub = null,      // 获取近期擦除任务列表
	wipeSub = null,         // 开始擦除任务
	quickSub = null,        // 订阅快速擦除上报
	fullSub = null,         // 订阅填充擦除上报
	abortSub = null;        // 中止初始化


function Initial() {
	const navigate = useNavigate();
	const [search] = useSearchParams();
	const [form] = Form.useForm();
	const [item, setItem] = useState({})
	const [jobList, setJobList] = useState([])
	const [loading, setLoading] = useState(false)
	const [wipeFlag, setFlag] = useState(true)
	const [percent, setPercent] = useState(0)
	const [jobId, setJob] = useState(0)


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (search.get('identifier')) {
			getDiskInfo(search.get('identifier'))
		}

		return () => {
			PubSub.unsubscribe(diskSub);
			PubSub.unsubscribe(jobListSub);
			PubSub.unsubscribe(wipeSub);
			PubSub.unsubscribe(quickSub);
			PubSub.unsubscribe(fullSub);
			PubSub.unsubscribe(abortSub);
		}
	}, []);

	// 获取硬盘基本信息
	const getDiskInfo = identifier => {
		let uuid = getUUID();
		diskSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (!isEmpty(result) && !isEmpty(result[0])) {
				let temp = result[0]
				setItem(temp)
				getJobsList(temp['name'])

				// 开启上报数据订阅 快速擦除及填充擦除分开订阅
				quickSub = PubSub.subscribe("disk.wipe-QUICK-"+result[0]['name'], (_, {result})=>{
					if (result['progress']) {
						let percent = result['progress']['percent'];
						if (result['state'] === 'SUCCESS') {
							setFlag(false);
							getJobsList(temp['name']);
						}
						setJob(result['id']);
						setPercent(percent.toFixed(3))
						if (form.getFieldValue('method') !== 'QUICK') {
							form.setFieldsValue({method: 'QUICK'})
						}
					}
				})
				fullSub = PubSub.subscribe("disk.wipe-FULL-"+result[0]['name'], (_, {result})=>{
					if (result['progress']) {
						let percent = result['progress']['percent'];
						if (result['state'] === 'SUCCESS') {
							setFlag(false);
							getJobsList(temp['name']);
						}
						setJob(result['id']);
						setPercent(percent.toFixed(3))
						if (form.getFieldValue('method') !== 'FULL') {
							form.setFieldsValue({method: 'FULL'})
						}
					}
				})
			}
		})
		WebSocketService.call(uuid, URL.DISK_QUERY, [[["identifier", "=", identifier]]]);
	}

	// 获取近期全部任务 至多显示10条
	const getJobsList = diskName => {
		const uuid = getUUID();
		jobListSub = PubSub.subscribe(uuid, (_, {result})=>{
			let flag, temp=result;
			if (result && result[0] && result[0]['state']==='RUNNING') flag = true;
			else {
				flag = false;
				setPercent(0)
			}
			if (result.length>10) temp = temp.slice(0, 10);
			setJobList(temp);
			setFlag(flag);
		})
		WebSocketService.call(uuid, URL.JOBS_QUERY, [[['method', '=', 'disk.wipe'], ['arguments', 'in' ,[[diskName, 'QUICK'], [diskName, 'FULL']]]], {order_by: ["-id"]}]);
	}

	// 开始硬盘初始化
	const handleSubmit = values => {
		const next = () => {
			setLoading(true);
			let uuid = getUUID();
			wipeSub = PubSub.subscribe(uuid, (_, {result})=>{
				setLoading(false);
				if (!isEmpty(result)) {
					setFlag(true);
					setJob(result);
					getJobsList(item['name']);
				}
			})
			WebSocketService.call(uuid, URL.DISK_WIPE, [item['name'], values['method']]);
		}

		Modal.confirm({
			title: `是否初始化硬盘${item['name']}`,
			onOk: next
		})
	}

	// 中止硬盘初始化
	const abortWipe = () => {
		const next = () => {
			if (jobId !== 0) {
				let uuid = getUUID();
				abortSub = PubSub.subscribe(uuid, ()=>{
					getJobsList(item['name'])
				})
				WebSocketService.call(uuid, URL.JOBS_ABORT, [jobId]);
			}
		}

		Modal.confirm({
			title: '中止初始化',
			content: `您确定要中止硬盘 ${item.name} 的初始化吗？`,
			onOk: next,
		})
	}

	// 提交按钮行样式
	const tailFormItemLayout = {
		wrapperCol: {
			xs: {
				span: 24,
				offset: 0,
			},
			sm: {
				span: 14,
				offset: 6,
			},
		},
	};

	// columns
	const columns = [
		{title: '序号', dataIndex: 'index', width: '10%', render: (t,r,i)=>i+1},
		{title: '擦除方法', dataIndex: 'arguments', width: '17%', render: t=>{if (t[1]==='QUICK') return '快速'; return '填充'}},
		{title: '状态', dataIndex: 'state', width: '17%'},
		{title: '开始时间', dataIndex: 'time_started', width: '28%', render: t=>{if (t) return moment(t['$date']).format('YYYY-MM-DD HH:mm:ss'); else return ''}},
		{title: '完成时间', dataIndex: 'time_finished', width: '28%', render: t=>{if (t) return moment(t['$date']).format('YYYY-MM-DD HH:mm:ss'); else return ''}},
	];

	return (
		<div className={'full-page'}>
			<Row className={'title'}>硬盘初始化</Row>
			<Row className={'sub-title'}>擦除硬盘</Row>
			<Row type={'flex'}>
				<Col style={{width: 470}}>
					<Form
						labelCol={{span: 6,}}
						wrapperCol={{span: 14,}}
						layout="horizontal"
						initialValues={{size: 'default',}}
						size={'default'}
						style={{width: 450,}}
						form={form}
						onFinish={handleSubmit}
					>

						<Form.Item label="硬盘名">
							{item['name']}
						</Form.Item>
						<Form.Item label="序列号">
							{item['serial']}
						</Form.Item>
						<Form.Item label="擦除方法" name={'method'} rules={[{ required: true, message: '请选择擦除方法！' }]}>
							<Select options={[{label: '快速', value: 'QUICK'}, {label: '用0进行填充', value: 'FULL'}]} />
						</Form.Item>
						<Form.Item label="进度" name={'progress'}>
							<Progress percent={percent} size="small" status="active" />
						</Form.Item>
						<Form.Item {...tailFormItemLayout}>
							<Button type="primary" htmlType="submit" loading={loading} disabled={wipeFlag}>
								开始
							</Button>
							<Button style={{marginLeft: '10px'}} disabled={!wipeFlag} onClick={abortWipe}>
								中止
							</Button>
							<Button style={{marginLeft: '10px'}} onClick={()=>{navigate('/storage/disks')}}>
								返回
							</Button>
						</Form.Item>
					</Form>
				</Col>
				<Col style={{width: 650}}>
					<Row style={{marginBottom: '10px'}}><b>该硬盘近期擦除任务</b></Row>
					<Table
						size={'middle'}
						pagination={false}
						columns={columns}
						rowKey={(record) => record.id}
						dataSource={jobList}
					/>
				</Col>
			</Row>
		</div>
	);
}

export default Initial;
