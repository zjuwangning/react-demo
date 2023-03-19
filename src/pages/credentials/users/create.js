import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, Form, InputNumber, notification } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { usernameValidator, passwordValidator, tipsText } from "./helptext";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty } from "../../../utils/cmn";


function UserCreate() {
	const [form] = Form.useForm();
	const [userList, setUserList] = useState([])
	const [groupOptions, setOptions] = useState([])
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate();
	let createSub = null, uidSub = null, groupSub = null, userSub = null;

	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			let uuid = getUUID();
			uidSub = PubSub.subscribe(uuid, (_, result)=>{form.setFieldsValue({uid: result})})
			WebSocketService.call(uuid, URL.USER_UID_QUERY);

			uuid = getUUID();
			groupSub = PubSub.subscribe(uuid, (_, result)=>{
				if (isEmpty(result)) notification.warning({message: '暂无用户分组，请先创建用户分组！'})
				else {
					let options = [];
					for (let k in result) {
						options.push({label: result[k]['group'], value: result[k]['id']})
					}
					setOptions(options);
				}
			})
			WebSocketService.call(uuid, URL.GROUP_QUERY);

			uuid = getUUID();
			userSub = PubSub.subscribe(uuid, (_, result)=>{
				let temp = [];
				result.map(item=>{
					if (!isEmpty(item) && !isEmpty(item['username'])) temp.push(item['username'])
				})
				setUserList(temp);
			})
			WebSocketService.call(uuid, URL.USER_QUERY);
		}

		return () => {
			PubSub.unsubscribe(createSub);
			PubSub.unsubscribe(uidSub);
			PubSub.unsubscribe(groupSub);
			PubSub.unsubscribe(userSub);
		}
	}, []);

	const handleSubmit = values => {
		if (WebSocketService) {
			delete values['confirmPassword'];
			const uuid = getUUID();
			setLoading(true);
			createSub = PubSub.subscribe(uuid, (_, result)=>{createCallback(result)})
			WebSocketService.call(uuid, URL.USER_CREATE, [values]);
		}
	}

	const createCallback = result => {
		setLoading(false);
		if (result && result>0) {
			notification.success({message: '新建用户', description: '新建NAS用户成功'});
			navigate('/credentials/users')
		}
	}

	const usernameUse = (_, value) => {
		if (!isEmpty(value) && userList.includes(value)) {
			return Promise.reject();
		}
		return Promise.resolve();
	}

	// 提交按钮行样式
	const tailFormItemLayout = {
		wrapperCol: {
			xs: {
				span: 24,
				offset: 0,
			},
			sm: {
				span: 14,
				offset: 6,
			},
		},
	};

	return (
		<div className={'full-page'}>
			<Row className={'title'}>新建NAS用户</Row>
			<Row className={'sub-title'}>创建新的NAS用户</Row>
			<Row type={'flex'} justify={'center'}>
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
					<Form.Item
						label="用户名" name="username" tooltip={tipsText.usernameTips}
						rules={
							[
								{ validator: usernameValidator, message: tipsText.usernameMsg },
								{ validator: usernameUse, message: tipsText.usernameInUse },
								{ required: true, message: tipsText.usernameRequire },
							]
						}
					>
						<Input />
					</Form.Item>
					<Form.Item label="全名" name="full_name" rules={[{ required: true, message: '请输入全名！', whitespace: true }]}>
						<Input />
					</Form.Item>
					<Form.Item
						label="密码" name="password"
						rules={[{ validator: passwordValidator, message: tipsText.passwordMsg }, { required: true, message: tipsText.passwordRequire }]}
					>
						<Input.Password/>
					</Form.Item>
					<Form.Item label="确认密码" name="confirmPassword" rules={[{ required: true, message: '请确认密码！' },
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue('password') === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error('两次输入密码不匹配！'));
							},
						}),
					]}>
						<Input.Password/>
					</Form.Item>
					<Form.Item label="UID" name={'uid'} rules={[{ required: true, message: '请输入UID！' }]}>
						<InputNumber style={{width: '100%'}}/>
					</Form.Item>
					<Form.Item label="分配组" name={'group'} rules={[{ required: true, message: '请选择要分配的用户组！' }]}>
						<Select options={groupOptions}/>
					</Form.Item>
					<Form.Item {...tailFormItemLayout}>
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

export default UserCreate;
