import React, { useEffect, useState } from 'react';
import { Row, Button, Select, InputNumber, Form, Radio, notification, Modal, Checkbox } from 'antd'
import { useNavigate, useSearchParams } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, tailFormItemLayout } from "../../../utils/cmn"
import { timeOptions, weekOptions } from '../enum'

const keyList = ['begin', 'end', 'weekday', 'enabled']
let createSub = null, querySub = null;

function ScrubTaskEdit() {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [search] = useSearchParams();


	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();

		return () => {
			PubSub.unsubscribe(createSub);
			PubSub.unsubscribe(querySub);
		}
	}, []);


	// 获取定期校验任务信息
	const getData = () => {
		let uuid = getUUID();
		querySub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				let temp = {begin: "00:00", enabled: false, end: "00:00", weekday: []}
				for (let k in keyList) {
					if (result[keyList[k]]) {
						temp[keyList[k]] = result[keyList[k]]
					}
				}
				form.setFieldsValue(temp)
			}
		})
		WebSocketService.call(uuid, URL.RE_SILVER_CONFIG);
	}

	// 分 时 日 月 周
	const handleSubmit = values => {

		Modal.confirm({
			title: '确认操作',
			content: '是否确认保存校验任务优先级设定',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();

					createSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							Modal.error({title: '保存错误', content: error.reason})
						}
						else {
							notification.success({message: '校验任务优先级设定保存成功'});
							navigate('/task/scrub-task')
						}
						resolve();
					})
					WebSocketService.call(uuid, URL.RE_SILVER_UPDATE, [values]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>重排优先级</Row>
			<Row className={'sub-title'}>为校验任务设定优先执行的时间段</Row>
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
				>
					<Form.Item label="启用优先级设定" name="enabled" valuePropName={'checked'}>
						<Checkbox />
					</Form.Item>
					<Form.Item
						label="开始时间" name={'begin'} rules={[{ required: true, message: '请选择开始时间！' }]}
						tooltip={'将校验任务设为高优先级的开始时间。若开始时间在结束时间前，则时间段在同一天内；若开始时间等于结束时间或开始时间在结束时间后，则时间段为跨一天。'}
					>
						<Select options={timeOptions}/>
					</Form.Item>
					<Form.Item
						label="结束时间" name={'end'} rules={[{ required: true, message: '请选择开始时间！' }]}
						tooltip={'将校验任务设为高优先级的结束时间。'}
					>
						<Select options={timeOptions}/>
					</Form.Item>
					<Form.Item
						label="周日期" name={'weekday'} rules={[{ required: true, message: '请选择开始时间！' }]}
						tooltip={'将校验任务设为高优先级的周日期。'}
					>
						<Select options={weekOptions} mode={'multiple'}/>
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
