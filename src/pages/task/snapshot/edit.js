import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, InputNumber, Form, Radio, notification, Modal, Checkbox } from 'antd'
import { useNavigate, useSearchParams } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, tailFormItemLayout } from "../../../utils/cmn";
import { periodOptions, weekOptions, delKeyList } from '../enum'


let querySub = null, pathSub = null, editSub = null;     // 为数据集添加协议

function SnapshotTaskEdit() {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [search] = useSearchParams();

	const [options, setOptions] = useState([])          // 目录选项
	const [recurring, setRecurring] = useState('')      // 再次发生样式 每日 每周


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (search.get('id')) {
			getData();
			getPath();
		}
		else {
			// 路径错误
		}

		return () => {
			PubSub.unsubscribe(querySub);
			PubSub.unsubscribe(pathSub);
			PubSub.unsubscribe(editSub);
		}
	}, []);

	// 获取定期快照任务信息
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
		WebSocketService.call(uuid, URL.SNAP_TASK_QUERY, [[["id", '=', Number(search.get('id'))]]]);
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
					let item = {value: result[k]['id'], title: result[k]['id']}
					temp.push(item)
				}
				setOptions(temp)
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[], {extra: {properties: ['']}}]);
	}

	// 整理数据设置form初始值
	const generateData = item => {
		let params = {};
		params['dataset'] = item['dataset']
		params['enabled'] = item['enabled']
		params['lifetime_value'] = item['lifetime_value']
		params['lifetime_unit'] = item['lifetime_unit']
		params['naming_schema'] = item['naming_schema']
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
			content: '是否确认修改定期快照任务',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();

					editSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							notification.error({message: '快照创建失败，请稍后重试'})
							resolve();
						}
						else {
							notification.success({message: '修改定期快照任务成功'});
							resolve();
							navigate('/task/snapshot-task')
						}
					})
					WebSocketService.call(uuid, URL.SNAP_TASK_UPDATE, [Number(search.get('id')), values]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	//
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
			<Row className={'title'}>编辑定期快照</Row>
			<Row className={'sub-title'}>编辑修改已创建的定期快照任务</Row>
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

					<Form.Item label="启用该定期快照" name="enabled" valuePropName={'checked'}>
						<Checkbox />
					</Form.Item>
					<Form.Item {...tailFormItemLayout(5)}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/task/snapshot-task')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default SnapshotTaskEdit;
