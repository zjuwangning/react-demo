import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, notification, Modal, Form, Radio, Input } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let configSub = null,
	updateSub = null;

function Smb() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 数据集列表
	const [loading, setLoading] = useState(false);

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();

		return () => {
			PubSub.unsubscribe(configSub);
			PubSub.unsubscribe(updateSub);
		}
	}, []);

	// 获取smb协议config数据
	const getData = () => {
		let uuid = getUUID();
		configSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '获取SMB配置错误，请稍后重试'})
			}
			else {
				let params = {}
				params['workgroup'] = result['workgroup'];
				params['description'] = result['description'];
				params['enable_smb1'] = 0;
				if (result['enable_smb1']) {
					params['enable_smb1'] =1;
				}
				form.setFieldsValue(params)
			}
		})
		WebSocketService.call(uuid, URL.SMB_CONFIG, []);
	}

	//
	const handleSubmit = values => {
		if (values['enable_smb1']===1) values['enable_smb1'] = true
		else if (values['enable_smb1']===0) values['enable_smb1'] = false

		Modal.confirm({
			title: '确认操作',
			content: '确认修改SMB配置',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					updateSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: 'SMB设置错误'});
						}
						else {
							notification.success({message: 'SMB设置成功'});
							navigate('/share/protocol');
						}
					})
					WebSocketService.call(uuid, URL.SMB_UPDATE, [values]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>SMB设置</Row>
			<Row className={'sub-title'}>修改系统的samba设置</Row>
			<Row className={'actions'} />
			<Row type={'flex'}>
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
					<Form.Item label="工作组" name={'workgroup'} rules={[{ required: true, message: '请填写工作组名称！' }]}>
						<Input />
					</Form.Item>
					<Form.Item label="描述" name={'description'}>
						<Input />
					</Form.Item>
					<Form.Item label="1.0支持" name={'enable_smb1'} rules={[{ required: true, message: '请选择1.0支持！' }]}>
						<Radio.Group>
							<Radio value={1}>启用</Radio>
							<Radio value={0}>禁用</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item label="隐藏文件" name={'files'}>
						{/*<Radio.Group>*/}
						{/*	<Radio value={1}>启用</Radio>*/}
						{/*	<Radio value={2}>禁用</Radio>*/}
						{/*</Radio.Group>*/}
					</Form.Item>
					<Form.Item {...tailFormItemLayout(6)}>
						<Button type="primary" htmlType="submit" loading={loading}>
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/credentials/users')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default Smb;
