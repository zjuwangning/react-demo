import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, notification, Modal, Form, Checkbox, InputNumber } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let configSub = null,
	updateSub = null;
const keyList = ['rootlogin', 'passwordauth', 'tcpfwd']

function SSH() {
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
				params['tcpport'] = result['tcpport']
				for (let k in keyList) {
					params[keyList[k]] = !!result[keyList[k]];
				}
				form.setFieldsValue(params)
			}
		})
		WebSocketService.call(uuid, URL.SSH_CONFIG, []);
	}

	//
	const handleSubmit = values => {
		let temp = {tcpport: values['tcpport']}
		for (let k in keyList) {
			temp[keyList[k]] = !!values[keyList[k]];
		}

		Modal.confirm({
			title: '确认操作',
			content: '确认修改SSH配置',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					updateSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							Modal.error({
								title: '操作错误',
								content: error.reason
							})
						}
						else {
							notification.success({message: 'SSH设置成功'});
							navigate('/system/service');
						}
					})
					WebSocketService.call(uuid, URL.SSH_UPDATE, [temp]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>SSH设置</Row>
			<Row className={'sub-title'}>修改系统的SSH设置</Row>
			<Row className={'actions'} />
			<Row type={'flex'}>
				<Form
					labelCol={{span: 12,}}
					wrapperCol={{span: 12,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 450,}}
					form={form}
					onFinish={handleSubmit}
				>
					<Form.Item label="端口" name={'tcpport'} rules={[{ required: true, message: '请填写SSH端口！' }]} tooltip={'开放给SSH连接的端口号'}>
						<InputNumber />
					</Form.Item>
					<Form.Item label="root使用密码登录" name={'rootlogin'} valuePropName={'checked'} tooltip={'允许root登录，但必须为 root 用户帐户设置密码。不鼓励使用root登录。'}>
						<Checkbox />
					</Form.Item>
					<Form.Item label="允许密码验证" name={'passwordauth'} valuePropName={'checked'} tooltip={'启用目录服务时，允许密码身份验证可以授予目录服务所有用户访问权限。禁用更改身份验证以要求所有用户使用密钥。这需要额外设置SSH客户端和服务器。'}>
						<Checkbox />
					</Form.Item>
					<Form.Item label="允许TCP端口转发" name={'tcpfwd'} valuePropName={'checked'} tooltip={'设置为允许用户使用SSH端口转发功能绕过防火墙限制。'}>
						<Checkbox />
					</Form.Item>
					<Form.Item {...tailFormItemLayout(12)}>
						<Button type="primary" htmlType="submit" loading={loading}>
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/share/protocol')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default SSH;
