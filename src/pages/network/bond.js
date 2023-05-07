import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, InputNumber, Form, notification, Modal, Checkbox } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../server/enum";
import { WebSocketService } from "../../server";
import {getUUID, tailFormItemLayout} from "../../utils/cmn";

let fetchSub = null, createSub = null;     // 为数据集添加协议
const protocolOptions = [{label: 'LACP', value: 'LACP'}, {label: 'FAILOVER', value: 'FAILOVER'}, {label: 'LOADBALANCE', value: 'LOADBALANCE'}, ]


function BindNet() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [options, setOptions] = useState([])      // 存储池选项


	// componentDidMount componentWillUnmount
	useEffect(() => {
		getNet();


		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(createSub);
		}
	}, []);

	// 获取网卡 生成选项
	const getNet = () => {
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				let temp = [];
				for (let k in result) {
					temp.push({label: result[k]['id'], value: result[k]['id']})
				}
				setOptions(temp);
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_QUERY);
	}

	//
	const handleSubmit = values => {
		let params = {};
		params['type'] = 'LINK_AGGREGATION';
		params['name'] = values['name'];
		params['lag_ports'] = values['lag_ports'];
		params['lag_protocol'] = values['lag_protocol'];
		params['mtu'] = values['mtu']+'';
		params['aliases'] = [];
		if (values['address'] && values['netmask']) {
			params['aliases'] = [{address: values['address'], type: "INET", netmask: values['netmask']}];
		}
		params['ipv4_dhcp'] = values['ipv4_dhcp']===true
		params['ipv6_auto'] = values['ipv6_auto']===true

		Modal.confirm({
			title: '确认操作',
			content: '是否确认绑定网卡',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					createSub = PubSub.subscribe(uuid, (_, {error})=>{
						if (error) {
							Modal.error({
								title: '绑定错误',
								content: error.reason
							})
							resolve();
						}
						else {
							notification.success({message: '网卡绑定创建成功'});
							resolve();
							navigate('/network')
						}
					})
					WebSocketService.call(uuid, URL.NETWORK_CREATE, [params]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// 名称格式
	const nameValidator = (_, value) => {

		return Promise.resolve();
		return Promise.reject();
	}

	return (
		<div className={'full-page'}>
			<Row className={'title'}>绑定</Row>
			<Row className={'sub-title'}>创建网卡绑定</Row>
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
					<Form.Item label="名称" name={'name'} tooltip={'网卡绑定名称需输入“bond”+任意不重复数字。例如：bond1、bond2'} rules={[{ required: true, message: '请填写名称！' }, {validator: nameValidator, message: '名称格式错误'}]} >
						<Input />
					</Form.Item>
					<Form.Item label="聚合协议" name={'lag_protocol'} rules={[{ required: true, message: '请选择聚合协议！' }]}>
						<Select options={protocolOptions}/>
					</Form.Item>
					<Form.Item label="绑定网卡" name={'lag_ports'} rules={[{ required: true, message: '请选择要绑定的网卡！' }]}>
						<Select mode="multiple" options={options}/>
					</Form.Item>
					<Form.Item label="MTU" name={'mtu'} tooltip={'MTU为介于 1492 和 9216 之间的数字'}  rules={[{ required: true, message: '请填写MTU！' }]}>
						<InputNumber style={{width: '100%'}} min={1492} max={9216}/>
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
						<InputNumber style={{width: '100%'}}/>
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

export default BindNet;
