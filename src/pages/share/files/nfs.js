import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Row, Modal, notification, Form, Input, Radio, Button } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {isEmpty, getUUID, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let nfsSub = null,
	authSub = null;
const squashMap = {
	all: {mapall_group: null, mapall_user: "nobody", maproot_group: null, maproot_user: null},
	root: {mapall_group: null, mapall_user: null, maproot_group: null, maproot_user: "nobody"},
	noRoot: {mapall_group: null, mapall_user: null, maproot_group: null, maproot_user: "root"},
}


function NFSAuth() {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [search] = useSearchParams();

	const [files, setFile] = useState({});


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			if (search.get('id')) {
				getData();
			}
			else {
				// 数据没有拿到id 跳转错误
			}
		}

		return () => {
			PubSub.unsubscribe(nfsSub);
			PubSub.unsubscribe(authSub);
		}
	}, []);

	// 获取共享文件数据
	const getData = () => {
		let uuid = getUUID();
		nfsSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				setFile(result[0])
				let params = {};
				params['ro'] = result[0]['ro']?"1":'0'
				if (result[0]['hosts']) {
					params['hosts'] = ""
					for (let k in result[0]['hosts']) {
						params['hosts']+=result[0]['hosts'][k]+','
					}
				}
				if (result[0]['mapall_user'] === 'nobody') params['squash'] = 'all';
				else if (result[0]['maproot_user'] === 'nobody') params['squash'] = 'root';
				else if (result[0]['maproot_user'] === 'root') params['squash'] = 'noRoot';
				form.setFieldsValue(params)
			}
		})
		WebSocketService.call(uuid, URL.SHARE_NFS_QUERY, [[["id", "=", Number(search.get('id'))]]]);
	}

	//
	const handleSubmit = values => {
		let params = squashMap[values['squash']]
		params['ro'] = values['ro'] === '1';
		let hosts = values['hosts'];
		hosts = hosts.split(/[\t\r\f\n\s]*/g).join('');
		if (hosts[hosts.length-1] === ',') {
			hosts = hosts.slice(0, hosts.length-1)
		}
		hosts = hosts.split(',')
		params['hosts'] = hosts

		Modal.confirm({
			title: '确认操作',
			content: '是否确认nfs授权',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					authSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						if (error) {
							notification.error({message: 'nfs授权失败，请稍后重试'})
						}
						else {
							resolve();
							notification.success({message: '授权成功'});
							navigate('/share/files');
						}
					})
					WebSocketService.call(uuid, URL.SHARE_NFS_UPDATE, [Number(search.get('id')), params]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>NFS授权</Row>
			<Row className={'sub-title'}>配置NFS的允许IP，读写权限</Row>
			<Row type={'flex'} style={{marginTop: '4vh'}}>
				<Form
					labelCol={{span: 6}}
					wrapperCol={{span: 18}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 500}}
					form={form}
					onFinish={handleSubmit}
				>
					<Form.Item label="文件路径">{isEmpty(files)?'':files['paths'][0]}</Form.Item>
					<Form.Item label="允许IP" tooltip={'不同IP地址之间使用 ,（英文标点逗号）分隔'} name="hosts" rules={[{required: true, message: '请填写允许IP！'}]}>
						<Input placeholder={'example,192.168.1.*,192.17.1.*'}/>
					</Form.Item>
					<Form.Item label="权限" name="ro" rules={[{required: true, message: '请选择读写权限！'}]}>
						<Radio.Group>
							<Radio value="1">只读</Radio>
							<Radio value="0">读写</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item label="Squash模式" name="squash" rules={[{required: true, message: '请选择Squash模式！'}]}>
						<Radio.Group>
							<Radio value="all">All Squash</Radio>
							<Radio value="root">Root Squash</Radio>
							<Radio value="noRoot">No Root Squash</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item {...tailFormItemLayout(6)}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/share/files')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default NFSAuth;
