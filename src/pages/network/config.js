import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, InputNumber, Form, notification, Modal, Checkbox } from 'antd'
import {useNavigate, useSearchParams} from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../server/enum";
import { WebSocketService } from "../../server";
import { getUUID, isEmpty, tailFormItemLayout } from "../../utils/cmn";

let fetchSub = null, editSub = null;     // 为数据集添加协议
const protocolOptions = [{label: 'LACP', value: 'LACP'}, {label: 'FAILOVER', value: 'FAILOVER'}, {label: 'LOADBALANCE', value: 'LOADBALANCE'}, ]


function NetConfig() {
	const [form] = Form.useForm();
	const [search] = useSearchParams();
	const navigate = useNavigate();

	const [netInfo, setInfo] = useState({})      // 网络名称


	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (search.get('id')) {
			getNet();
		}
		else {
			notification.error({message: '未获取到网卡信息，请输入正确的地址！'})
		}

		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(editSub);
		}
	}, []);

	// 获取网络信息
	const getNet = () => {
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				console.log('result', result);
				let temp = {}
				temp['ipv4_dhcp'] = result[0]['ipv4_dhcp']
				temp['ipv6_auto'] = result[0]['ipv6_auto']
				if (!isEmpty(result[0]['aliases']) && !isEmpty(result[0]['aliases'][0]) && !isEmpty(result[0]['aliases'][0]['address'])) {
					temp['address'] = result[0]['aliases'][0]['address']
				}
				if (!isEmpty(result[0]['aliases']) && !isEmpty(result[0]['aliases'][0]) && !isEmpty(result[0]['aliases'][0]['netmask'])) {
					temp['netmask'] = result[0]['aliases'][0]['netmask']
				}
				temp['mtu'] = result[0]['state']['mtu']
				setInfo(result[0]);
				form.setFieldsValue(temp)
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_QUERY, [[["id", "=", search.get('id')]]]);
	}

	//
	const handleSubmit = values => {
		if (!search.get('id')) {
			notification.error({message: '未获取到网卡信息，请输入正确的地址！'})
			return ;
		}

		let params = {};
		params['mtu'] = values['mtu']+'';
		params['aliases'] = [];
		if (values['address'] && values['netmask']) {
			params['aliases'] = [{address: values['address'], type: "INET", netmask: values['netmask']}];
		}
		params['ipv4_dhcp'] = values['ipv4_dhcp']===true
		params['ipv6_auto'] = values['ipv6_auto']===true

		Modal.confirm({
			title: '确认操作',
			content: '是否确认修改网络配置',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					editSub = PubSub.subscribe(uuid, (_, {error})=>{
						resolve();
						if (error) {
							Modal.error({
								title: '网络配置错误',
								content: error.reason
							})
						}
						else {
							notification.success({message: '网络配置成功'});
							navigate('/network')
						}
					})
					WebSocketService.call(uuid, URL.NETWORK_UPDATE, [search.get('id'), params]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>配置</Row>
			<Row className={'sub-title'}>配置网卡IP、子网掩码，网络模式等</Row>
			<Row type={'flex'} style={{marginTop: '4vh', width: '460px'}}>
				<Form
					form={form}
					labelCol={{span: 6,}}
					wrapperCol={{span: 18,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: 450}}
					onFinish={handleSubmit}
				>
					<Form.Item label="名称">
						{netInfo['name']}
					</Form.Item>
					<Form.Item label="DHCP" name={'ipv4_dhcp'} valuePropName={'checked'}>
						<Checkbox />
					</Form.Item>
					<Form.Item label="自动配置ipv6" name={'ipv6_auto'} valuePropName={'checked'}>
						<Checkbox />
					</Form.Item>
					<Form.Item label="ip地址" name={'address'}>
						<Input />
					</Form.Item>
					<Form.Item label="子网掩码" name={'netmask'}>
						<Input />
					</Form.Item>
					<Form.Item label="MTU" name={'mtu'} tooltip={'MTU为介于 1492 和 9216 之间的数字'}  rules={[{ required: true, message: '请填写MTU！' }]}>
						<InputNumber style={{width: '100%'}} min={1492} max={9216}/>
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

export default NetConfig;
