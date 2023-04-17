import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, notification, Modal, Form, Select, Input } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import {passwordValidator, tipsText} from "../../credentials/users/helptext";

let configSub = null,
	updateSub = null;
const keyList = ['protocol', 'password', 'tcpport', 'tcpportssl'];

function WebDav() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 数据集列表
	const [loading, setLoading] = useState(false);
	const [protocol, setProtocol] = useState('');

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
				if (result['protocol']) {
					setProtocol(result['protocol'])
				}
				for (let k in keyList) {
					params[keyList[k]] = result[keyList[k]]
				}
				console.log('params', params);
				form.setFieldsValue(params)
			}
		})
		WebSocketService.call(uuid, URL.DAV_CONFIG, []);
	}

	//
	const handleSubmit = values => {
		delete values['confirmPassword'];

		Modal.confirm({
			title: '确认操作',
			content: '确认修改WebDAV配置',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					updateSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: 'WebDAV设置错误'});
						}
						else {
							notification.success({message: 'WebDAV设置成功'});
							navigate('/share/protocol');
						}
					})
					WebSocketService.call(uuid, URL.DAV_UPDATE, [values]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'protocol') {
			setProtocol(changedValues[changeKey])
		}
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>WebDAV设置</Row>
			<Row className={'sub-title'}>修改系统的WebDAV设置</Row>
			<Row className={'actions'} />
			<Row type={'flex'}>
				<Form
					labelCol={{span: 6,}}
					wrapperCol={{span: 14,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 550,}}
					form={form}
					onFinish={handleSubmit}
					onValuesChange={onDataChange}
				>
					<Form.Item
						label="协议选择" name={'protocol'}
						rules={[{ required: true, message: '请选择协议！' }]}
						tooltip={'HTTP会保持连接不加密。HTTPS会加密连接。HTTP+HTTPS 同时允许两种类型的连接。'}
					>
						<Select options={[{label: 'HTTP', value: 'HTTP'}, {label: 'HTTPS', value: 'HTTPS'}, {label: 'HTTP+HTTPS', value: 'HTTPHTTPS'}]}/>
					</Form.Item>
					{
						protocol === 'HTTP' || protocol === 'HTTPHTTPS'?(
							<Form.Item
								label="HTTP端口" name={'tcpport'}
								rules={[{ required: true, message: '请填写HTTP端口！' }]}
								tooltip={'为HTTP连接指定端口。推荐默认端口8080。不要重复一个端口。'}
							>
								<Input />
							</Form.Item>
						):''
					}
					{
						protocol === 'HTTPS' || protocol === 'HTTPHTTPS'?(
							<Form.Item
								label="HTTPS端口" name={'tcpportssl'}
								rules={[{ required: true, message: '请填写HTTPS端口！' }]}
								tooltip={'为HTTPS连接指定端口。推荐默认端口8081。不要重复一个端口。'}
							>
								<Input />
							</Form.Item>
						):''
					}


					<Form.Item label="用户名" name={'description'}>

					</Form.Item>
					<Form.Item
						label="设置密码" name="password"
						rules={[{ required: true, message: '请设置连接密码！' }]}
					>
						<Input.Password/>
					</Form.Item>
					<Form.Item label="确认密码" name="confirmPassword" rules={[
						({ getFieldValue }) => ({
							validator(_, value) {
								if (getFieldValue('password') === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error('两次输入密码不匹配！'));
							},
						}),
					]}>
						<Input.Password/>
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

export default WebDav;
