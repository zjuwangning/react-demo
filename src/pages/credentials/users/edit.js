import React, { useEffect, useState } from 'react';
import { Row, Button, Form, Input, Select, notification } from 'antd'
import { useNavigate, useSearchParams } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID, isEmpty, tailFormItemLayout } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import { passwordValidator, tipsText } from "./helptext";

let editSub = null,
	fetchSub = null,
	groupSub = null;
let extraGroup = [];

function UserEdit() {
	const [form] = Form.useForm();
	const [groupOptions, setOptions] = useState([])
	const [loading, setLoading] = useState(false)
	const [item, setItem] = useState({})
	const navigate = useNavigate();
	const [search] = useSearchParams();

	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (search.get('id')) {
			getGroups();
		}
		else {
			// 数据没有拿到id 跳转错误
		}

		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(groupSub);
			PubSub.unsubscribe(editSub);
		}
	}, []);

	// 获取用户数据
	const getUser = (builtin, builtinGroup) => {
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (!isEmpty(result) && !isEmpty(result[0])) {
				setItem(result[0])
				let temp = {};
				temp['group'] = result[0]['group']['id'];
				if (builtin.includes(result[0]['group']['id'])) {
					temp['group'] = result[0]['group']['bsdgrp_group'];
				}
				temp['groups'] = []
				extraGroup = []
				for (let k in result[0]['groups']) {
					if (builtin.includes(result[0]['groups'][k])) {
						extraGroup.push(result[0]['groups'][k])
					}
					else {
						temp['groups'].push(result[0]['groups'][k])
					}
				}
				form.setFieldsValue(temp)
			}
		})
		WebSocketService.call(uuid, URL.USER_QUERY, [[["id", "=", Number(search.get('id'))]]]);
	}

	// 获取全部组数据 生成选项
	const getGroups = () => {
		let uuid = getUUID();
		groupSub = PubSub.subscribe(uuid, (_, {result})=>{
			if (isEmpty(result)) notification.warning({message: '暂无用户分组，请先创建用户分组！'})
			else {
				let options = [], temp = {}, builtin = [];
				for (let k in result) {
					if (result[k]['builtin']) {
						temp[result[k]['id']] = result[k]['group'];
						builtin.push(result[k]['id']);
					}
					else {
						options.push({label: result[k]['group'], value: result[k]['id']})
					}
				}
				setOptions(options);
				getUser(builtin, temp);
			}
		})
		WebSocketService.call(uuid, URL.GROUP_QUERY);
	}

	// handleSubmit
	const handleSubmit = values => {
		if (WebSocketService) {
			let temp = {}
			if (typeof values['group'] === 'number') {
				temp['group'] = values['group'];
			}
			temp['groups'] = values['groups'];
			if (extraGroup.length>0) {
				temp['groups'] = temp['groups'].concat(extraGroup)
			}
			if (!isEmpty(values['password'])) temp['password'] = values['password'];

			const uuid = getUUID();
			setLoading(true);
			editSub = PubSub.subscribe(uuid, (_, {result})=>{
				setLoading(false);
				if (result && result>0) {
					notification.success({message: '修改NAS用户', description: '修改NAS用户成功'});
					navigate('/credentials/users')
				}
			})
			WebSocketService.call(uuid, URL.USER_EDIT, [item['id'], temp]);
		}
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>修改NAS用户</Row>
			<Row className={'sub-title'}>修改NAS用户</Row>
			<Row type={'flex'} style={{width: '480px', marginTop: '20px'}}>
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

					<Form.Item label="用户名">
						{item['username']}
					</Form.Item>
					<Form.Item label="主用户组" name={'group'} rules={[{ required: true, message: '请选择要分配的用户组！' }]}>
						<Select options={groupOptions}/>
					</Form.Item>
					<Form.Item label="附加组" name={'groups'}>
						<Select mode={'multiple'} options={groupOptions}/>
					</Form.Item>
					<Form.Item
						label="修改密码" name="password"
						rules={[{ validator: passwordValidator, message: tipsText.passwordMsg }]}
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

export default UserEdit;
