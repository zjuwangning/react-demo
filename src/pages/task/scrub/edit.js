import React, { useEffect, useState } from 'react';
import { Row, Button, Select, InputNumber, Form, Radio, notification, Modal, Checkbox } from 'antd'
import { useNavigate, useSearchParams } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, tailFormItemLayout } from "../../../utils/cmn"
import { periodOptions, weekOptions, delKeyList } from '../enum'

let poolSub = null, createSub = null, querySub = null;

function ScrubTaskEdit() {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [search] = useSearchParams();

	const [options, setOptions] = useState([])      // 存储池选项
	const [recurring, setRecurring] = useState('')      // 存储池选项


	// componentDidMount componentWillUnmount
	useEffect(() => {
		getPool();
		getData();

		return () => {
			PubSub.unsubscribe(poolSub);
			PubSub.unsubscribe(createSub);
			PubSub.unsubscribe(querySub);
		}
	}, []);

	// 获取存储池 生成选项
	const getPool = () => {
		if (WebSocketService) {
			let uuid = getUUID();
			poolSub = PubSub.subscribe(uuid, (_, {result})=>{
				let temp = [];
				for (let k in result) {
					temp.push({label: result[k]['name'], value: result[k]['id']})
				}
				setOptions(temp);
			})
			WebSocketService.call(uuid, URL.POOL_QUERY);
		}
	}

	// 获取定期校验任务信息
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
		WebSocketService.call(uuid, URL.SCRUB_TASK_QUERY, [[["id", '=', Number(search.get('id'))]]]);
	}

	// 整理数据设置form初始值
	const generateData = item => {
		let params = {};
		params['pool'] = item['pool']
		params['enabled'] = item['enabled']
		params['threshold'] = item['threshold']
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
		form.setFieldsValue(params)
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
			schedule['hour'] = values['interval'].join(',')
		}
		else if (values['nextStyle'] === 'weeks') {
			schedule['hour'] = values['execution']+'';
			schedule['dow'] = values['weekPlan'].join(',');
		}
		values['schedule'] = schedule;

		if (values['enabled'] === undefined) {
			values['enabled'] = false
		}

		for (let k in delKeyList) {
			delete values[delKeyList[k]]
		}
		Modal.confirm({
			title: '确认操作',
			content: '是否确认保存定期校验任务',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();

					createSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							Modal.error({title: '编辑错误', content: error.reason})
						}
						else {
							notification.success({message: '编辑定期校验任务成功'});
							navigate('/task/scrub-task')
						}
						resolve();
					})
					WebSocketService.call(uuid, URL.SCRUB_TASK_UPDATE, [Number(search.get('id')), values]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>创建校验任务</Row>
			<Row className={'sub-title'}>为存储池创建定期校验任务</Row>
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
					<Form.Item label="存储池" name={'pool'} rules={[{ required: true, message: '请选择目录！' }]}>
						<Select options={options}/>
					</Form.Item>
					<Form.Item
						label="阈值天数" name={'threshold'} rules={[{ required: true, message: '请填写快照保存时间！' }]}
						tooltip={
							'校验任务允许再次允许的间隔天数。' +
							'例如当设置校验任务每天运行，阈值天数为7时，校验任务会尝试每天定点运行直到校验任务全部完成，' +
							'此时校验任务仍会每天进行检查但不再运行，直到7天后，才会再次运行。' +
							'阈值设置为7的倍数可以保证校验任务每次重新运行都是相同的周工作日。'
						}
					>
						<InputNumber style={{width: '100%'}}/>
					</Form.Item>
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

					<Form.Item label="启用该校验任务" name="enabled" valuePropName={'checked'}>
						<Checkbox />
					</Form.Item>
					<Form.Item {...tailFormItemLayout(5)}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/task/scrub-task')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default ScrubTaskEdit;
