import React, { useEffect, useState } from 'react';
import {Row, Col, Button, Modal, Input, Form, Radio, notification, Progress, Table} from 'antd'
import { useNavigate, useSearchParams } from "react-router-dom";
import PubSub from "pubsub-js";
import moment from 'moment';
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty } from "../../../utils/cmn";
import { PoolScanFunction, PoolScanState, PoolScrubAction } from './enum'

let startSub = null,
	jobSub = null,
	fetchSub = null,
	jobListSub = null;


function PoolScrub() {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false)
	const [item, setItem] = useState({})
	const [percent, setPercent] = useState(0)
	const [scrubFlag, setFlag] = useState(true)
	const [jobList, setJobList] = useState([])
	const [search] = useSearchParams();
	const navigate = useNavigate();


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('id')) {
				getPoolInfo(search.get('id'));
				getJobsList(search.get('id'));
				jobSub = PubSub.subscribe("pool.scrub-START-"+search.get('id'), (_, {result})=>{
					if (result['progress']) {
						let percent = result['progress']['percent'];
						if (result['state'] === 'SUCCESS') {
							setFlag(false);
							getJobsList(search.get('id'));
						}
						setPercent(percent.toFixed(2))
					}
				})
			}
			else {
				// 数据没有拿到id 跳转错误
			}
		}

		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(startSub);
			PubSub.unsubscribe(jobListSub);
		}
	}, []);

	// 获取池信息
	const getPoolInfo = () => {
		const uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (!isEmpty(result) && !isEmpty(result[0])) {
				setItem(result[0])
				// 正在校验中
				if (result[0]['scan']['function'] === PoolScanFunction.Scrub && result[0]['scan']['state'] === PoolScanState.Scanning) {
					setFlag(true);
				}
				else {
					setFlag(false);
				}
			}
		})
		WebSocketService.call(uuid, URL.POOL_QUERY, [[["id", "=", Number(search.get('id'))]]]);
	}

	// 获取近期全部任务 至多显示10条
	const getJobsList = poolId => {
		const uuid = getUUID();
		jobListSub = PubSub.subscribe(uuid, (_, {result})=>{
			let temp = [];
			let flag = false;
			for (let k in result) {
				if (result[k]['arguments'][1] === 'STOP') {
					flag = true;
				}
				else if (result[k]['arguments'][1] === 'START') {
					if (flag) {
						result[k]['state'] = 'ABORT'
						flag = false;
					}
					temp.push(result[k])
					if (temp.length>=10) break;
				}
			}
			setJobList(temp);
		})
		WebSocketService.call(uuid, URL.JOBS_QUERY, [[['method', '=', 'pool.scrub'], ['arguments', 'in' ,[[poolId, 'START'], [poolId, 'STOP']]]], {order_by: ["-id"]}]);
	}

	// 开始校验
	const startScrub = () => {
		let uuid = getUUID();
		if (WebSocketService && search.get('id')) {
			setLoading(true);
			startSub = PubSub.subscribe(uuid, (_, {result})=>{
				setLoading(false);
				if (!isEmpty(result)) {
					setFlag(true);
					getJobsList(search.get('id'));
				}
			})
			WebSocketService.call(uuid, URL.POOL_SCRUB, [search.get('id'), PoolScrubAction.Start]);
		}
	}

	// 中止校验
	const stopScrub = () => {
		let uuid = getUUID();
		if (WebSocketService && search.get('id')) {
			setLoading(true);
			startSub = PubSub.subscribe(uuid, (_, {result})=>{
				setLoading(false);
				if (!isEmpty(result)) {
					getJobsList(search.get('id'));
				}
			})
			WebSocketService.call(uuid, URL.POOL_SCRUB, [search.get('id'), PoolScrubAction.Stop]);
		}
	}

	// confirmScrub
	const confirmScrub = (start=true) => {
		Modal.confirm({
			title: `是否${start?'开始':'终止'}存储池校验`,
			onOk: start?startScrub:stopScrub
		})
	}

	// columns
	const columns = [
		{title: '序号', dataIndex: 'index', width: '15%', render: (t,r,i)=>i+1},
		{title: '状态', dataIndex: 'state', width: '19%'},
		{title: '开始时间', dataIndex: 'time_started', width: '33%', render: t=>{if (t) return moment(t['$date']).format('YYYY-MM-DD HH:mm:ss'); else return ''}},
		{title: '完成时间', dataIndex: 'time_finished', width: '33%', render: t=>{if (t) return moment(t['$date']).format('YYYY-MM-DD HH:mm:ss'); else return ''}},
	];


	return (
		<div className={'full-page'}>
			<Row className={'title'}>存储池校验</Row>
			<Row className={'sub-title'}>存储池校验</Row>
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
					>
						<Form.Item label="名称" name="pool">
							{item['name']}
						</Form.Item>
						<Form.Item label="进度" name="progress">
							<Progress percent={percent} size="large" status="active"/>
						</Form.Item>
						<Row type={'flex'} justify={'center'}>
							<Button type="primary" loading={loading} disabled={scrubFlag} onClick={confirmScrub}>
								开始
							</Button>
							<Button style={{marginLeft: '10px'}} loading={loading} disabled={!scrubFlag} onClick={()=>{confirmScrub(false)}}>
								中止
							</Button>
							<Button style={{marginLeft: '10px'}} onClick={()=>{navigate('/storage/pools')}}>
								返回
							</Button>
						</Row>
					</Form>
				</Col>
				<Col style={{width: 600}}>
					<Row style={{marginBottom: '10px'}}><b>该存储池近期校验任务</b></Row>
					<Table
						size={'middle'}
						pagination={false}
						columns={columns}
						rowKey={(record) => record.id}
						dataSource={jobList}
						loading={loading}
					/>
				</Col>
			</Row>
		</div>
	);
}

export default PoolScrub;
