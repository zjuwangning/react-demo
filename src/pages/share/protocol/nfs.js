import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, notification, Modal, Form, Radio, Input } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let configSub = null,
	updateSub = null;

function Nfs() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 数据集列表
	const [loading, setLoading] = useState(false);

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
				params['v4'] = 0;
				if (result['v4']) {
					params['v4'] =1;
				}
				form.setFieldsValue(params)
			}
		})
		WebSocketService.call(uuid, URL.NFS_CONFIG, []);
	}

	//
	const handleSubmit = values => {
		values['v4'] = values['v4'] === 1;

		Modal.confirm({
			title: '确认操作',
			content: 'NFS配置修改时，NFS服务会重启，进行中的NFS读写业务可能出错，请谨慎操作。',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					updateSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: 'NFS设置错误'});
						}
						else {
							notification.success({message: 'NFS设置成功'});
							navigate('/share/protocol');
						}
					})
					WebSocketService.call(uuid, URL.NFS_UPDATE, [values]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>NFS设置</Row>
			<Row className={'sub-title'}>修改系统的NFS设置</Row>
			<Row className={'actions'} />
			<Row type={'flex'}>
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
					<Form.Item label="NFSv4" name={'v4'} rules={[{ required: true, message: '请选择NFSv4！' }]}>
						<Radio.Group>
							<Radio value={1}>启用</Radio>
							<Radio value={0}>禁用</Radio>
						</Radio.Group>
					</Form.Item>
					{/*<Form.Item label="进程数量" name={'description'}>*/}
					{/*	<Input />*/}
					{/*</Form.Item>*/}
					<Form.Item {...tailFormItemLayout(6)}>
						<Button type="primary" htmlType="submit" loading={loading}>
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/share/protocol')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default Nfs;
