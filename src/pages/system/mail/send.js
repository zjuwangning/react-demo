import React, { useEffect, useState } from 'react';
import { Row, Button, Input, notification, InputNumber, Modal, Form, Checkbox, Select, Popover } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID, isEmpty, tailFormItemLayout } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import Cache from "../../../utils/Cache";

let userSub = null, sendSub = null, hostSub = null, taskSub = null, updateSub = null, configSub = null;
const keyList = ['fromemail', 'fromname', 'outgoingserver', 'port', 'security']
const securityKeyList = {PLAIN: 25, SSL: 465, TLS: 587}


function Send() {
	const [form] = Form.useForm();
	const [auth, setAuth] = useState(false);        // 是否启用smtp认证
	const [email, setEmail] = useState('');      // 登录用户邮件地址
	const [hostname, setHost] = useState('');      // 登录用户邮件地址
	const [loading, setLoading] = useState(false);

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getUserInfo();
		getHost();
		getMailConfig();

		return () => {
			PubSub.unsubscribe(userSub);
			PubSub.unsubscribe(sendSub);
			PubSub.unsubscribe(hostSub);
			PubSub.unsubscribe(taskSub);
			PubSub.unsubscribe(updateSub);
			PubSub.unsubscribe(configSub);
		}
	}, []);

	// 获取已配置的发送方信息
	const getMailConfig = () => {
		let uuid = getUUID();
		configSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '邮箱配置数据获取错误，请稍后重试'})
				form.setFieldsValue({port: 25, security: 'PLAIN'})
			}
			else {
				if (result && result['id']) {
					delete result['id']
					delete result['oauth']
					if (result['smtp']) {
						setAuth(true)
					}
					form.setFieldsValue(result);
				}
				else {
					form.setFieldsValue({port: 25, security: 'PLAIN'})
				}
			}
		})
		WebSocketService.call(uuid, URL.MAIL_CONFIG);
	}

	// 获取登录用户信息 显示是否配置邮箱
	const getUserInfo = () => {
		let user = Cache.getUserInfo();
		let uuid = getUUID();
		userSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '登录用户数据获取错误'})
			}
			else {
				let temp = ''
				if (result && result[0] && result[0]['email']) {
					temp = result[0]['email']
				}
				setEmail(temp)
			}
		})
		WebSocketService.call(uuid, URL.USER_QUERY, [[['username', '=', user['username']]]]);
	}

	// 获取主机名
	const getHost = () => {
		let uuid = getUUID();
		hostSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				if (result && result['hostname']) {
					setHost(result['hostname'])
				}
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_GLOBAL_CONFIG);
	}

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'smtp') {
			setAuth(changedValues[changeKey])
		}
		else if (changeKey === 'security') {
			form.setFieldValue('port', securityKeyList[changedValues[changeKey]])
		}
	}

	//
	const handleSubmit = values => {
		setLoading(true);
		let temp = formatData(values);
		let uuid = getUUID();
		updateSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			setLoading(false);
			if (error) {
				Modal.error({
					title: '发送测试邮件错误',
					content: error.reason
				})
			}
			else {
				notification.success({message: '邮件发送方信息保存完成'})
			}
		})
		WebSocketService.call(uuid, URL.MAIL_UPDATE,[temp]);
	}

	// 发送测试邮件
	const sendTest = () => {
		setLoading(true);
		form.validateFields().then((values)=>{
			let mailText = {
				subject: "Test Message from "+hostname,
				text: "This is a test message from SmarStor NAS."
			}
			let temp = formatData(values)
			let uuid = getUUID();
			sendSub = PubSub.subscribe(uuid, (_, {error, result})=>{
				if (error) {
					setLoading(false);
					Modal.error({
						title: '发送测试邮件错误',
						content: error.reason
					})
				}
				else {
					sendProgress()
				}
			})
			WebSocketService.call(uuid, URL.MAIL_SEND,[mailText, temp]);
		})
	}

	// 监听发送任务
	const sendProgress = () => {
		taskSub = PubSub.subscribe(URL.MAIL_SEND, (_, {result})=>{
			if (result['state'] === 'SUCCESS') {
				PubSub.unsubscribe(taskSub);
				setLoading(false);
				notification.success({message: '发送测试邮件成功'});
			}
			else if (result['state'] === 'FAILED') {
				PubSub.unsubscribe(taskSub);
				setLoading(false);
				Modal.error({
					title: '发送测试邮件错误',
					content: result.error
				})
			}
		})
	}

	// 格式化数据
	const formatData = (values) => {
		let temp = {}
		for (let k in keyList) {
			if (values[keyList[k]]) {
				temp[keyList[k]] = values[keyList[k]]
			}
		}
		if (values['smtp']) {
			temp['smtp'] = true;
			temp['user'] = values['user'];
			temp['pass'] = values['pass'];
		}
		else {
			temp['smtp'] = false;
		}
		return temp;
	}


	return (
		<div>
			<Row type={'flex'} style={{marginTop: '10px', marginLeft: '30px'}}>
				提示：发送测试邮件功能，接收邮件地址为登录用户配置的邮箱
				{
					email?('：'+email):(<span>，<span style={{color: 'red'}}>您当前暂未配置，发送测试邮件功能不可用</span></span> )
				}
			</Row>
			<Row type={'flex'} style={{width: '520px', marginTop: '20px'}}>
				<Form
					labelCol={{span: 8,}}
					wrapperCol={{span: 16,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 500,}}
					form={form}
					onFinish={handleSubmit}
					onValuesChange={onDataChange}
				>
					<Form.Item label="发送方邮件地址" name={'fromemail'} rules={[{ required: true, message: '请输入发送方邮件地址！'}]}>
						<Input />
					</Form.Item>
					<Form.Item label="发送方名称" name={'fromname'} rules={[{ required: true, message: '请输入发送方名称！'}]}>
						<Input />
					</Form.Item>
					<Form.Item label="邮件服务器" name={'outgoingserver'} rules={[{ required: true, message: '请输入邮件服务器！'}]}>
						<Input />
					</Form.Item>
					<Form.Item label="加密选项" name={'security'} rules={[{ required: true, message: '请选择加密选项！'}]}>
						<Select options={[{label: '无加密', value: 'PLAIN'}, {label: 'SSL', value: 'SSL'}, {label: 'TLS', value: 'TLS'}]}/>
					</Form.Item>
					<Form.Item label="邮件服务器端口" name={'port'} tooltip={'SMTP端口号。通常为 25, 465(SSL) 或 587(TLS)'} rules={[{ required: true, message: '请输入邮件服务器端口！'}]}>
						<InputNumber />
					</Form.Item>
					<Form.Item label="SMTP认证" name={'smtp'} valuePropName={'checked'}>
						<Checkbox />
					</Form.Item>
					{
						auth?(
							<Form.Item label="用户名" name={'user'} rules={[{ required: true, message: '请输入用户名！'}]}>
								<Input />
							</Form.Item>
						):''
					}
					{
						auth?(
							<Form.Item label="密码" name={'pass'} rules={[{ required: true, message: '请输入密码！'}]}>
								<Input.Password />
							</Form.Item>
						):''
					}
					<Form.Item {...tailFormItemLayout(8)}>
						<Button type="primary" htmlType="submit" loading={loading}>
							保存
						</Button>
						<Popover content={'测试邮件目的地址为登录用户邮箱'} trigger="hover">
							<Button style={{marginLeft: '10px'}} onClick={sendTest} loading={loading} disabled={isEmpty(email)}>
								发送测试邮件
							</Button>
						</Popover>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default Send;
