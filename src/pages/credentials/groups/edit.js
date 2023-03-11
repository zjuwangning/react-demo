import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, Form, InputNumber, notification } from 'antd'
import {useNavigate, useSearchParams} from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty } from "../../../utils/cmn";
import './index.css'


function GroupEdit() {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false)
	const [groupList, setGroupList] = useState([])
	const [item, setItem] = useState({})
	const navigate = useNavigate();
	const [search, setSearch] = useSearchParams();
	let fetchSub = null, editSub = null, groupSub = null;

	// componentDidMount componentWillUnmount
	useEffect(() => {
		let uuid = getUUID();

		if (search.get('id')) {
			WebSocketService.call(uuid, URL.GROUP_QUERY, [[["id", "=", Number(search.get('id'))]]]);
			fetchSub = PubSub.subscribe(uuid, (_, data)=>{
				if (!isEmpty(data) && !isEmpty(data[0])) {
					setItem(data[0])
					form.setFieldsValue({name: data[0]['name']})
				}
			})

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
		else {
			// 数据没有拿到id 跳转错误
		}

		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(editSub);
			PubSub.unsubscribe(groupSub);
		}
	}, []);

	const handleSubmit = values => {
		console.log('values', values);
		let temp = {}
		temp['name'] = values['name'];

		const uuid = getUUID();
		setLoading(true);
		editSub = PubSub.subscribe(uuid, (_, result)=>{
			setLoading(false);
			if (result && result>0) {
				notification.success({message: '修改NAS群组', description: '修改NAS群组成功'});
				navigate('/credentials/groups')
			}
		})
		WebSocketService.call(uuid, URL.GROUP_EDIT, [item['id'], temp]);
	}

	const createCallback = result => {
		setLoading(false);
		if (result && result>0) {
			notification.success({message: '修改群组', description: '修改NAS群组成功'});
			navigate('/credentials/groups')
		}
	}

	const groupNameUse = (_, value) => {
		if (!isEmpty(value) && value !== item['name'] && groupList.includes(value)) {
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
			<Row className={'title'}>修改NAS群组</Row>
			<Row className={'sub-title'}>修改NAS群组</Row>
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
					<Form.Item label="GID" name={'gid'}>
						{item['gid']}
					</Form.Item>
					<Form.Item label="名称" name="name" rules={
						[
							{ required: true, message: '请输入群组名称！', whitespace: true },
							{ validator: groupNameUse, message: '该群组名称已被使用' },
						]
					}>
						<Input />
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

export default GroupEdit;
