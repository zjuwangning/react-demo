import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Select, Input, InputNumber, Form, Radio, notification, Modal, Checkbox } from 'antd'
import {useNavigate, useSearchParams} from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, tailFormItemLayout } from "../../../utils/cmn"
import { periodOptions, weekOptions, syncOptions, syncKeyList, syncOtherKeyList } from '../enum'

let pathSub = null, userSub = null, querySub = null, saveSub = null;

function RsyncTaskEdit() {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [search] = useSearchParams();

	const [options, setOptions] = useState([])      // 路径选项
	const [checkData, setCheck] = useState([])      // checkbox区域
	const [userOptions, setUser] = useState([])     // 用户选项
	const [recurring, setRecurring] = useState('')  // 每日/每周
	const [mode, setMode] = useState('')            // rsync模式


	// componentDidMount componentWillUnmount
	useEffect(() => {
		generateCheckbox()
		getPath();
		getUser();
		getData();

		return () => {
			PubSub.unsubscribe(pathSub);
			PubSub.unsubscribe(userSub);
			PubSub.unsubscribe(querySub);
			PubSub.unsubscribe(saveSub);
		}
	}, []);

	// 生成checkbox列表
	const generateCheckbox = () => {
		let temp = [];
		for (let k in syncOptions) {
			temp.push((
				<Col span={6}>
					<Checkbox value={syncOptions[k]['value']} style={{ lineHeight: '32px' }}>{syncOptions[k]['label']}</Checkbox>
				</Col>
			))
		}
		temp = <Row>{temp}</Row>
		setCheck(temp)
	}

	// 获取路径数据 用于选项拼接
	const getPath = () => {
		let uuid = getUUID();
		pathSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let temp = [];
				for (let k in result) {
					let item = {value: result[k]['mountpoint'], label: result[k]['mountpoint']}
					temp.push(item)
				}
				setOptions(temp)
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[], {extra: {properties: ['mountpoint']}}]);
	}

	// 获取用户数据 用于选项拼接
	const getUser = () => {
		let uuid = getUUID();
		userSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let temp = [];
				for (let k in result) {
					if (!result[k]['builtin'] || result[k]['username'] === 'root') {
						let item = {value: result[k]['username'], label: result[k]['username']}
						temp.push(item)
					}
				}
				setUser(temp)
			}
		})
		WebSocketService.call(uuid, URL.USER_QUERY);
	}

	// 获取详细数据
	const getData = () => {
		let uuid = getUUID();
		querySub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				generateData(result[0])
			}
		})
		WebSocketService.call(uuid, URL.RSYNC_TASK_QUERY, [[["id", '=', Number(search.get('id'))]]]);
	}

	// 整理数据用于编辑
	const generateData = item => {
		let params = {};
		setMode(item['mode'])
		if (item['schedule']['dow'] === '*') {
			params['nextStyle'] = 'days'
			params['interval'] = item['schedule']['hour'].split(',')
			for (let k in params['interval']) {
				params['interval'][k] = Number(params['interval'][k])
			}
			setRecurring('days')
		}
		else {
			params['nextStyle'] = 'weeks'
			params['execution'] = Number(item['schedule']['hour'])
			params['weekPlan'] = item['schedule']['dow'].split(',')
			for (let k in params['weekPlan']) {
				params['weekPlan'][k] = Number(params['weekPlan'][k])
			}
			setRecurring('weeks')
		}
		for (let k in syncKeyList) {
			params[syncKeyList[k]] = item[syncKeyList[k]]
		}
		params['more'] = [];
		for (let k in syncOtherKeyList) {
			if (item[syncOtherKeyList[k]]) {
				params['more'].push(syncOtherKeyList[k])
			}
		}
		form.setFieldsValue(params)
	}

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'nextStyle') {
			setRecurring(changedValues[changeKey])
		}
		if (changeKey === 'mode') {
			setMode(changedValues[changeKey])
		}
	}

	// 分 时 日 月 周
	const handleSubmit = values => {
		let temp = {}, schedule = {minute: "0", hour: "0", dom: "*", month: "*", dow: "*"};
		// 按每日计算
		if (values['nextStyle'] === 'days') {
			schedule['hour'] = values['interval'].join(',')
		}
		else if (values['nextStyle'] === 'weeks') {
			schedule['hour'] = values['execution']+'';
			schedule['dow'] = values['weekPlan'].join(',');
		}
		temp['schedule'] = schedule;
		temp['enabled'] = false;

		for (let k in syncKeyList) {
			temp[syncKeyList[k]] = values[syncKeyList[k]]
		}

		for (let k in syncOtherKeyList) {
			temp[syncOtherKeyList[k]] = values['more'].includes(syncOtherKeyList[k]);
		}

		Modal.confirm({
			title: '确认操作',
			content: '是否确认保存定期同步任务修改',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();

					saveSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							Modal.error({title: '编辑错误', content: error.reason})
						}
						else {
							notification.success({message: '编辑定期同步任务成功'});
							navigate('/task/rsync-task')
						}
						resolve();
					})
					WebSocketService.call(uuid, URL.RSYNC_TASK_UPDATE, [Number(search.get('id')), temp]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>编辑同步任务</Row>
			<Row className={'sub-title'}>编辑已保存的定期同步任务</Row>
			<Row type={'flex'} style={{marginTop: '4vh', width: '650px'}}>
				<Form
					form={form}
					labelCol={{span: 5,}}
					wrapperCol={{span: 19,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 600}}
					onFinish={handleSubmit}
					onValuesChange={onDataChange}
				>
					<Form.Item label="目录" name={'path'} rules={[{ required: true, message: '请选择目录！' }]} tooltip={'要同步的存储池或共享文件目录'}>
						<Select options={options}/>
					</Form.Item>
					<Form.Item
						label="用户" name={'user'} rules={[{ required: true, message: '请选择用户！' }]}
						tooltip={'运行rsync任务的用户。所选用户必须具有写入远程主机上指定目录的权限。'}
					>
						<Select
							showSearch
							placeholder="Select a user"
							optionFilterProp="children"
							filterOption={(input, option) =>
								(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
							}
							options={userOptions}
						/>
					</Form.Item>
					<Form.Item label="方向" name={'direction'} rules={[{ required: true, message: '请选择方向！' }]}>
						<Select options={[{label: '推送', value: 'PUSH'}, {label: '拉取', value: 'PULL'}]}/>
					</Form.Item>
					<Form.Item
						label="远程主机" name={'remotehost'} rules={[{ required: true, message: '请输入远程主机地址！' }]}
						tooltip={'存储副本的远程系统的IP地址或主机名。如果用户名在远程主机上不同，请使用格式username@remote_host。'}
					>
						<Input />
					</Form.Item>
					<Form.Item label="Rsync模式" name={'mode'} rules={[{ required: true, message: '请选择Rsync模式！' }]}>
						<Select options={[{ label: 'Module', value: 'MODULE' }]} />
					</Form.Item>
					{
						mode === 'MODULE'?(
							<Form.Item label="远程模块名" name={'remotemodule'} rules={[{ required: true, message: '请输入远程模块名！' }]}>
								<Input />
							</Form.Item>
						):''
					}
					{
						mode === 'SSH'?(
							<>
								<Form.Item label="远程SSH端口" name={'remoteport'} rules={[{ required: true, message: '请输入远程SSH端口！' }]}>
									<Select options={[{ label: 'Module', value: 'MODULE' }, { label: 'SSH', value: 'SSH' }]} />
								</Form.Item>
								<Form.Item label="远程路径" name={'remotepath'} rules={[{ required: true, message: '请输入远程路径！' }]}>
									<Select options={[{ label: 'Module', value: 'MODULE' }, { label: 'SSH', value: 'SSH' }]} />
								</Form.Item>
							</>
						):''
					}
					<Form.Item label="再次发生样式" name="nextStyle" rules={[{required: true, message: '请选择再次发生样式！'}]}>
						<Radio.Group>
							<Radio value="days">每日</Radio>
							<Radio value="weeks">每周</Radio>
						</Radio.Group>
					</Form.Item>
					{
						recurring==='days'?(
							<Form.Item name="interval" label="每日执行时间" rules={[{required: true, message: '请选择每日执行时间！'},]}>
								<Select options={periodOptions} mode={'multiple'}/>
							</Form.Item>
						):''
					}
					{
						recurring==='weeks'?(
							<>
								<Form.Item name="execution" label="每日执行时间" rules={[{required: true, message: '请选择每日执行时间！'},]}>
									<Select options={periodOptions}/>
								</Form.Item>
								<Form.Item name="weekPlan" label="周计划日期" rules={[{required: true, message: '请选择周计划日期！'},]}>
									<Checkbox.Group options={weekOptions} />
								</Form.Item>
							</>
						):''
					}
					<Form.Item label="更多选项" name="more" >
						<Checkbox.Group>{checkData}</Checkbox.Group>
					</Form.Item>

					<Form.Item {...tailFormItemLayout(5)}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/task/rsync-task')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default RsyncTaskEdit;
