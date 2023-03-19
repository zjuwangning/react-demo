import React, { useEffect, useState } from 'react';
import { Row, Button, Transfer, notification } from 'antd'
import { useNavigate, useSearchParams } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty } from "../../../utils/cmn";
import './index.css'


function GroupMember() {
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

	const handleSubmit = () => {
		const uuid = getUUID();
		setLoading(true);
		editSub = PubSub.subscribe(uuid, (_, result)=>{
			setLoading(false);
			if (result && result>0) {
				notification.success({message: 'NAS群组成员', description: '保存NAS群组成员成功'});
				navigate('/credentials/groups')
			}
		})
		WebSocketService.call(uuid, URL.GROUP_EDIT, [item['id'], {users: memberList || []}]);
	}

	const onChange = (nextTargetKeys) => {
		setMember(nextTargetKeys);
	};

	return (
		<div className={'full-page'}>
			<Row className={'title'}>NAS群组成员</Row>
			<Row className={'sub-title'}>编辑NAS群组成员</Row>
			<Row type={'flex'} justify={'center'}>
				群组名称：{item['name']}
			</Row>
			<Row type={'flex'} justify={'center'} style={{marginTop: '2vh'}}>
				<Transfer
					dataSource={userList}
					titles={['所有用户', '组成员']}
					targetKeys={memberList}
					onChange={onChange}
					render={(item) => item.username}
				/>
			</Row>
			<Row type={'flex'} justify={'center'} style={{marginTop: '2vh'}}>
				<Button type={'primary'} onClick={handleSubmit} loading={loading}>保存</Button>
				<Button style={{marginLeft: '40px'}} onClick={()=>{navigate('/credentials/groups')}}>取消</Button>
			</Row>
		</div>
	);
}

export default GroupMember;
