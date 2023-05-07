import React, { useEffect } from 'react';
import { Row, Button, Input, Form, notification, Modal } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../server/enum";
import { WebSocketService } from "../../server";
import { getUUID, tailFormItemLayout } from "../../utils/cmn";

let fetchSub = null, configSub = null;     // 为数据集添加协议


function GlobalConfig() {
	const [form] = Form.useForm();
	const navigate = useNavigate();


	// componentDidMount componentWillUnmount
	useEffect(() => {
		getConfig();


		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(configSub);
		}
	}, []);

	// 获取全局配置
	const getConfig = () => {
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let temp = {};
				temp['hostname'] = result['hostname']
				temp['ipv4gateway'] = result['ipv4gateway']
				temp['nameserver1'] = result['nameserver1']
				form.setFieldsValue(temp)
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_GLOBAL_CONFIG);
	}

	//
	const handleSubmit = values => {
		Modal.confirm({
			title: '确认操作',
			content: '是否确认修改全局配置',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					configSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							notification.error({message: '全局配置修改失败，请稍后重试'})
							resolve();
						}
						else {
							notification.success({message: '全局配置修改成功'});
							resolve();
							navigate('/network');
						}
					})
					WebSocketService.call(uuid, URL.NETWORK_GLOBAL_UPDATE, [values]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>全局配置</Row>
			<Row className={'sub-title'}>配置网关、DNS、hostname</Row>
			<Row type={'flex'} style={{marginTop: '4vh'}}>
				<Form
					form={form}
					labelCol={{span: 6,}}
					wrapperCol={{span: 17,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 350}}
					onFinish={handleSubmit}
				>
					<Form.Item label="网关" name={'ipv4gateway'} rules={[{ required: true, message: '请填写网关！' }]}>
						<Input />
					</Form.Item>
					<Form.Item label="DNS" name={'nameserver1'} rules={[{ required: true, message: '请填写DNS！' }]}>
						<Input />
					</Form.Item>
					<Form.Item label="主机名" name={'hostname'} rules={[{ required: true, message: '请填写主机名！' }]}>
						<Input />
					</Form.Item>
					<Form.Item {...tailFormItemLayout(6)}>
						<Button type="primary" htmlType="submit">
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/network')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default GlobalConfig;
