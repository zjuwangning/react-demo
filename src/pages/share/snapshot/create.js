import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, Form, notification, Modal } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import moment from "moment";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, tailFormItemLayout } from "../../../utils/cmn";

let pathSub = null, createSub = null;     // 为数据集添加协议


function SnapCreate() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [options, setOptions] = useState([])      // 存储池选项


	// componentDidMount componentWillUnmount
	useEffect(() => {
		getPath();


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
				form.setFieldsValue({dataset: '', name: `manual-${moment().format('YYYY-MM-DD_HH-mm')}`})
				setOptions(temp)
			}
		})
		WebSocketService.call(uuid, URL.DATASET_QUERY, [[], {extra: {properties: ['']}}]);
	}

	//
	const handleSubmit = values => {
		Modal.confirm({
			title: '确认操作',
			content: '是否创建手动快照',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					let params = Object.assign(values, {recursive: false})
					createSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							notification.error({message: '快照创建失败，请稍后重试'})
							resolve();
						}
						else {
							notification.success({message: '创建快照成功'});
							resolve();
							navigate('/share/snapshot-manage')
						}
					})
					WebSocketService.call(uuid, URL.SNAPSHOT_CREATE, [params]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>创建手动快照</Row>
			<Row className={'sub-title'}>为存储池或共享文件创建手动快照</Row>
			<Row type={'flex'} style={{marginTop: '4vh'}}>
				<Form
					form={form}
					labelCol={{span: 6,}}
					wrapperCol={{span: 17,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 500}}
					onFinish={handleSubmit}
				>
					<Form.Item label="目录" name={'dataset'} rules={[{ required: true, message: '请选择目录！' }]}>
						<Select options={options}/>
					</Form.Item>
					<Form.Item label="快照名称" name={'name'} rules={[{ required: true, message: '请填写快照名称！' }]}>
						<Input />
					</Form.Item>
					<Form.Item {...tailFormItemLayout(6)}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/share/snapshot-manage')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default SnapCreate;
