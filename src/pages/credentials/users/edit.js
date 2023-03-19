import React, { useEffect, useState } from 'react';
import { Row, Button, Form, Input, Select, notification } from 'antd'
import { useNavigate, useSearchParams } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID, isEmpty } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import { passwordValidator, tipsText } from "./helptext";


function UserEdit() {
	const [form] = Form.useForm();
	const [groupOptions, setOptions] = useState([])
	const [loading, setLoading] = useState(false)
	const [item, setItem] = useState({})
	const navigate = useNavigate();
	const [search] = useSearchParams();
	let editSub = null;

	// componentDidMount componentWillUnmount
	useEffect(() => {
		let fetchSub = null, groupSub = null;
		let uuid = getUUID();
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

		if (search.get('id')) {
			uuid = getUUID();
			WebSocketService.call(uuid, URL.USER_QUERY, [[["id", "=", Number(search.get('id'))]]]);
			fetchSub = PubSub.subscribe(uuid, (_, data)=>{
				if (!isEmpty(data) && !isEmpty(data[0])) {
					setItem(data[0])
					form.setFieldsValue({group: data[0]['group']['id']})
				}
			})
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

	// handleSubmit
	const handleSubmit = values => {
		if (WebSocketService) {
			let temp = {}
			temp['group'] = values['group'];
			if (!isEmpty(values['password'])) temp['password'] = values['password'];

			const uuid = getUUID();
			setLoading(true);
			editSub = PubSub.subscribe(uuid, (_, result)=>{
				setLoading(false);
				if (result && result>0) {
					notification.success({message: '修改NAS用户', description: '修改NAS用户成功'});
					navigate('/credentials/users')
				}
			})
			WebSocketService.call(uuid, URL.USER_EDIT, [item['id'], temp]);
		}
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
			<Row className={'title'}>修改NAS用户</Row>
			<Row className={'sub-title'}>修改NAS用户</Row>
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

					<Form.Item label="用户名">
						{item['username']}
					</Form.Item>
					<Form.Item label="分配组" name={'group'} rules={[{ required: true, message: '请选择要分配的用户组！' }]}>
						<Select options={groupOptions}/>
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

export default UserEdit;
