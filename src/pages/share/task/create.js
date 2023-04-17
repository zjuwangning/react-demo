import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, InputNumber, Form, Radio, notification, Modal, Checkbox } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, tailFormItemLayout } from "../../../utils/cmn"
import { periodOptions, weekOptions, intervalOptions, delKeyList } from './enum'

let pathSub = null, createSub = null;

function TaskCreate() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [options, setOptions] = useState([])      // 存储池选项
	const [recurring, setRecurring] = useState('')      // 存储池选项


	// componentDidMount componentWillUnmount
	useEffect(() => {
		getPath();
		form.setFieldsValue({naming_schema: `auto-%Y-%m-%d_%H-%M`, start: 0, end: 23, interval: 86400})

		return () => {
			PubSub.unsubscribe(pathSub);
			PubSub.unsubscribe(createSub);
		}
	}, []);

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
					let item = {value: result[k]['id'], title: result[k]['id']}
					temp.push(item)
				}
				setOptions(temp)
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[], {extra: {properties: ['']}}]);
	}

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'nextStyle') {
			setRecurring(changedValues[changeKey])
		}
	}

	// 分 时 日 月 周
	const handleSubmit = values => {
		let schedule = {minute: "0", hour: "0", dom: "*", month: "*", dow: "*"}
		// 按每日计算
		if (values['nextStyle'] === 'days') {
			if (values['interval']>1800) {      // 间隔是小时
				let hour = values['interval']/3600
				let start = values['start']
				let hours = []
				while (start<=values['end']) {
					hours.push(start)
					start+=hour
				}
				schedule['hour'] = hours.join(',')
			}
			else {      // 间隔是分钟
				let minute = values['interval']/60
				schedule['minute'] = '0/'+minute
				schedule['hour'] = values['start']+'-'+values['end']
			}
		}
		else if (values['nextStyle'] === 'weeks') {
			schedule['hour'] = values['execution']+'';
			schedule['dow'] = values['weekPlan'].join(',');
		}
		values['schedule'] = schedule;

		if (values['enabled'] === undefined) {
			values['enabled'] = false
		}
		if (values['lifetime_unit'] === undefined) {
			values['lifetime_unit'] = 'WEEK'
		}
		values['allow_empty'] = true;
		values['recursive'] = true;

		for (let k in delKeyList) {
			delete values[delKeyList[k]]
		}
		Modal.confirm({
			title: '确认操作',
			content: '是否创建定期快照任务',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();

					createSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							notification.error({message: '快照创建失败，请稍后重试'})
							resolve();
						}
						else {
							notification.success({message: '创建定期快照任务成功'});
							resolve();
							navigate('/share/snapshot-task')
						}
					})
					WebSocketService.call(uuid, URL.SNAP_TASK_CREATE, [values]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']
	const suffixSelector = (
		<Form.Item name="lifetime_unit" noStyle>
			<Select
				style={{width: 70}} defaultValue={'WEEK'}
				options={[{label: '小时', value: 'HOUR'},{label: '天', value: 'DAY'},{label: '周', value: 'WEEK'},{label: '月', value: 'MONTH'},{label: '年', value: 'YEAR'}]}
			/>
		</Form.Item>
	);

	return (
		<div className={'full-page'}>
			<Row className={'title'}>创建定期快照</Row>
			<Row className={'sub-title'}>为存储池或共享文件创建定期快照任务</Row>
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
					<Form.Item label="目录" name={'dataset'} rules={[{ required: true, message: '请选择目录！' }]}>
						<Select options={options}/>
					</Form.Item>
					<Form.Item label="快照保存时间" name={'lifetime_value'} rules={[{ required: true, message: '请填写快照保存时间！' }]}>
						<InputNumber addonAfter={suffixSelector}/>
					</Form.Item>
					<Form.Item
						label="命名格式" name={'naming_schema'} rules={[{ required: true, message: '请填写快照命名格式！' }]}
						tooltip={'快照名称格式化字符串，默认值为 auto-%Y-%m-%d_%H-%M，如有修改，必须包含 %Y,、%m、 %d、%H、%M等字符子串。在生成快照文件时，这些子串分别被具体的年、月、日、小时、分钟代替'}
					>
						<Input />
					</Form.Item>
					<Form.Item label="再次发生样式" name="nextStyle" rules={[{required: true, message: '请选择再次发生样式！'}]}>
						<Radio.Group>
							<Radio value="days">每日</Radio>
							<Radio value="weeks">每周</Radio>
						</Radio.Group>
					</Form.Item>
					{
						recurring==='days'?(
							<>
								<Form.Item name="timePicker" label="时间周期" style={{marginBottom: 0,}} tooltip={'快照任务执行的时间范围'}>
									<Form.Item
										name="start" style={{display: 'inline-block', width: 'calc(45% - 8px)',}}
										rules={[
											{required: true, message: '请选择时间周期！'},
											({ getFieldValue }) => ({
												validator(_, value) {
													if (getFieldValue('end') >= value) {
														return Promise.resolve();
													}
													return Promise.reject(new Error('开始时间在结束时间之后！'));
												},
											}),
										]}
									>
										<Select options={periodOptions}/>
									</Form.Item>
									&nbsp;&nbsp;--&nbsp;&nbsp;
									<Form.Item
										name="end" style={{display: 'inline-block', width: 'calc(45% - 8px)',}}
										rules={[
											{required: true, message: '请选择时间周期！'},
											({ getFieldValue }) => ({
												validator(_, value) {
													if (getFieldValue('start') <= value) {
														return Promise.resolve();
													}
													return Promise.reject(new Error('开始时间在结束时间之后！'));
												},
											}),
										]}
									>
										<Select options={periodOptions}/>
									</Form.Item>
								</Form.Item>
								<Form.Item name="interval" label="间隔" rules={[{required: true, message: '请选择时间间隔！',}]}  tooltip={'快照任务执行的时间间隔，默认间隔24h即每日执行一次'}>
									<Select options={intervalOptions}/>
								</Form.Item>
							</>
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

					<Form.Item label="启用该定期快照" name="enabled" valuePropName={'checked'}>
						<Checkbox />
					</Form.Item>
					<Form.Item {...tailFormItemLayout(6)}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/share/snapshot-task')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default TaskCreate;
