import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, Form, InputNumber, notification } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty } from "../../../utils/cmn";

let createSub = null,
	uidSub = null,
	groupSub = null,
	userSub = null;


function GroupCreate() {
	const [form] = Form.useForm();
	const [groupList, setGroupList] = useState([])
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate();


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			let uuid = getUUID();
			uidSub = PubSub.subscribe(uuid, (_, result)=>{form.setFieldsValue({gid: result})})
			WebSocketService.call(uuid, URL.GROUP_GID_QUERY);

			uuid = getUUID();
			groupSub = PubSub.subscribe(uuid, (_, result)=>{
				let temp = [];
				result.map(item=>{
					if (!isEmpty(item) && !isEmpty(item['group'])) temp.push(item['group'])
				})
				setGroupList(temp);
			})
			WebSocketService.call(uuid, URL.GROUP_QUERY);
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
			const uuid = getUUID();
			setLoading(true);
			createSub = PubSub.subscribe(uuid, (_, result)=>{createCallback(result)})
			WebSocketService.call(uuid, URL.GROUP_CREATE, [values]);
		}
	}

	const createCallback = result => {
		setLoading(false);
		if (result && result>0) {
			notification.success({message: '新建群组', description: '新建NAS群组成功'});
			navigate('/credentials/groups')
		}
	}

	const groupNameUse = (_, value) => {
		if (!isEmpty(value) && groupList.includes(value)) {
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
			<Row className={'title'}>新建NAS群组</Row>
			<Row className={'sub-title'}>创建新的NAS群组</Row>
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
					<Form.Item label="名称" name="name" rules={
						[
							{ required: true, message: '请输入群组名称！', whitespace: true },
							{ validator: groupNameUse, message: '该群组名称已被使用' },
						]
					}>
						<Input />
					</Form.Item>
					<Form.Item label="GID" name={'gid'} rules={[{ required: true, message: '请输入GID！' }]}>
						<InputNumber style={{width: '100%'}}/>
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

export default GroupCreate;
