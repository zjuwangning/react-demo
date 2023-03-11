import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, Form, Transfer, notification } from 'antd'
import {useNavigate, useSearchParams} from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty } from "../../../utils/cmn";
import './index.css'


function GroupMember() {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false)
	const [item, setItem] = useState({});           // 当前群组信息
	const [userList, setUser] = useState([]);       // 全部user列表
	const [memberList, setMember] = useState([]);   // 当前组内user列表
	const navigate = useNavigate();
	const [search] = useSearchParams();
	let fetchSub = null,    // 获取当前群组信息
		editSub = null,     // 保存NAS群组成员信息
		memberSub = null,   // 获取当前组内成员
		userSub = null;     // 获取所有用户

	// componentDidMount componentWillUnmount
	useEffect(() => {
		let uuid = getUUID();

		if (search.get('id')) {
			fetchSub = PubSub.subscribe(uuid, (_, data)=>{
				if (!isEmpty(data) && !isEmpty(data[0])) {
					setItem(data[0])
					if (data[0] && data[0]['users'] && data[0]['users'].length>0) {
						uuid = getUUID();
						userSub = PubSub.subscribe(uuid, (_, data)=>{
							let memberList = []
							for (let k in data) {
								memberList.push(data[k]['id']+'')
							}
							console.log('memberList', memberList);
							setMember(memberList)
						})
						WebSocketService.call(uuid, URL.USER_QUERY, [[["id", "in", data[0]['users']]]]);
					}
				}
			})
			WebSocketService.call(uuid, URL.GROUP_QUERY, [[["id", "=", Number(search.get('id'))]]]);

			uuid = getUUID();
			userSub = PubSub.subscribe(uuid, (_, data)=>{
				for (let k in data) {
					data[k]['key'] = data[k]['id']+''
				}
				setUser(data)
			})
			WebSocketService.call(uuid, URL.USER_QUERY);



		}
		else {
			// 数据没有拿到id 跳转错误
		}

		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(userSub);
			PubSub.unsubscribe(editSub);
			PubSub.unsubscribe(memberSub);
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
			notification.success({message: 'NAS群组成员', description: '编辑NAS群组成员成功'});
			navigate('/credentials/groups')
		}
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>NAS群组成员</Row>
			<Row className={'sub-title'}>编辑NAS群组成员</Row>
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
					<Form.Item label="群组名称">
						{item['name']}
					</Form.Item>
				</Form>
			</Row>
			<Row type={'flex'} justify={'center'}>
				<Transfer
					dataSource={userList}
					titles={['所有用户', '组成员']}
					targetKeys={memberList}
					// selectedKeys={selectedKeys}
					// onChange={onChange}
					// onSelectChange={onSelectChange}
					// onScroll={onScroll}
					render={(item) => item.username}
				/>
			</Row>
		</div>
	);
}

export default GroupMember;
