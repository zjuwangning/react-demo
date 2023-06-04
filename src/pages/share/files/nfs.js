import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import {Row, Col, Modal, notification, Form, Input, Radio, Button, InputNumber, Select} from "antd";
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
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
const options = [
	{label: '31', value: 31}, {label: '30', value: 30}, {label: '29', value: 29}, {label: '28', value: 28},
	{label: '27', value: 27}, {label: '26', value: 26}, {label: '25', value: 25}, {label: '24', value: 24},
	{label: '23', value: 23}, {label: '22', value: 22}, {label: '21', value: 21}, {label: '20', value: 20},
	{label: '19', value: 19}, {label: '18', value: 18}, {label: '17', value: 17}, {label: '16', value: 16},
	{label: '15', value: 15}, {label: '14', value: 14}, {label: '13', value: 13}, {label: '12', value: 12},
	{label: '11', value: 11}, {label: '10', value: 10}, {label: '9', value: 9}, {label: '8', value: 8},
	{label: '7', value: 7}, {label: '6', value: 6}, {label: '5', value: 5}, {label: '4', value: 4},
	{label: '3', value: 3}, {label: '2', value: 2}, {label: '1', value: 1}, {label: '0', value: 0},
]


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
				if (result[0]['mapall_user'] === 'nobody') params['squash'] = 'all';
				else if (result[0]['maproot_user'] === 'nobody') params['squash'] = 'root';
				else if (result[0]['maproot_user'] === 'root') params['squash'] = 'noRoot';

				params['networks'] = []
				for (let k in result[0]['networks']) {
					let temp = result[0]['networks'][k].split('/');
					params['networks'][k] = {net: temp[0], suffix: getMask(temp[1])}
				}
				if (params['networks'].length === 0) {
					params['networks'] = [{net: '', suffix: '255.255.255.0'}]
				}
				params['hosts'] = result[0]['hosts']
				if (params['hosts'].length === 0) {
					params['hosts'] = ['']
				}
				form.setFieldsValue(params)
			}
		})
		WebSocketService.call(uuid, URL.SHARE_NFS_QUERY, [[["id", "=", Number(search.get('id'))]]]);
	}

	//
	const handleSubmit = values => {
		let params = squashMap[values['squash']]
		params['enabled'] = true
		params['hosts'] = []
		params['networks'] = []
		params['ro'] = values['ro'] === '1';

		let temp = []
		for (let k in values['hosts']) {
			if (values['hosts'][k] && values['hosts'][k].trim().length>0) {
				temp.push(values['hosts'][k].trim())
			}
		}
		if (temp.length>0) {
			params['hosts'] = temp
		}
		temp = []
		for (let k in values['networks']) {
			if (values['networks'][k]['net'] && values['networks'][k]['net'].trim().length>0) {
				let cidr = getCidr(values['networks'][k]['suffix'])
				if (cidr === -1) {
					notification.error({message: '子网掩码格式错误'})
					return;
				}
				temp.push(values['networks'][k]['net'].trim()+'/'+cidr)
			}
		}
		if (temp.length>0) {
			params['networks'] = temp
		}

		Modal.confirm({
			title: '确认操作',
			content: '是否确认nfs授权',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					authSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						if (error) {
							Modal.error({title: 'nfs授权失败，请稍后重试', content: error.reason})
						}
						else {
							notification.success({message: '授权成功'});
							navigate('/share/files');
						}
						resolve();
					})
					WebSocketService.call(uuid, URL.SHARE_NFS_UPDATE, [Number(search.get('id')), params]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	// 通过CIDR生成子网掩码
	const getMask = cidr => {
		let index = 0, temp = '', rtnArr = []
		for (let k=32;k--;k>0) {
			if (cidr>0) temp+='1'
			else temp+='0'
			cidr--;
			index++
			if (index === 8) {
				index = 0
				rtnArr.push(temp)
				temp = ''
			}
		}
		for (let k in rtnArr) {
			rtnArr[k] = parseInt(rtnArr[k], 2)
		}
		return rtnArr.join('.');
	}

	// 通过子网掩码生成CIDR
	const getCidr = mask => {
		if (isEmpty(mask)) {
			return -1;
		}
		let arr = mask.split('.')
		if (arr.length !== 4) {
			return -1;
		}
		for (let k in arr) {
			if (Number(arr[k])+'' !== arr[k]) {
				return -1;
			}
			else if (Number(arr[k])>255 || Number(arr[k])<0) {
				return -1;
			}
		}

		let str = ''
		for (let k in arr) {
			str+=Number(arr[k]).toString(2)
		}
		let flag = false, rtn = 0;
		for (let k in str) {
			if (str[k] === '1') {
				rtn++
				if (flag) {
					return -1;
				}
			}
			else if (str[k] === '0') {
				flag = true
			}
		}
		return rtn;
	}

	const formItemLayout = {
		labelCol: {
			xs: {
				span: 24,
			},
			sm: {
				span: 6,
			},
		},
		wrapperCol: {
			xs: {
				span: 24,
			},
			sm: {
				span: 20,
			},
		},
	};
	const formItemLayoutWithOutLabel = {
		wrapperCol: {
			xs: {
				span: 24,
				offset: 0,
			},
			sm: {
				span: 18,
				offset: 6,
			},
		},
	};


	return (
		<div className={'full-page'}>
			<Row className={'title'}>NFS授权</Row>
			<Row className={'sub-title'}>配置NFS的允许IP，读写权限</Row>
			<div style={{marginTop: '4vh'}}>
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

					<Form.List name="networks">
						{(fields, { add, remove }, { errors }) => (
							<>
								{fields.map((field, index) => (
									<Form.Item
										{...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
										label={index === 0 ? '授权网络' : ''}
										tooltip={index === 0? '网络/子网掩码的格式。留空以允许所有。' : ''}
										required={false}
										key={field.key}
									>
										<Form.Item {...field} name={[field.name, 'net']} validateTrigger={['onChange', 'onBlur']} noStyle >
											<Input style={{width: '45%',}} />
										</Form.Item>&nbsp;/&nbsp;
										<Form.Item name={[field.name, 'suffix']} noStyle>
											<Input style={{width: '45%',}} />
										</Form.Item>
										{fields.length > 1 ? (<MinusCircleOutlined style={{fontSize: '18px', marginLeft: '5px'}} onClick={() => remove(field.name)}/>) : null}
									</Form.Item>
								))}
								<Form.Item>
									<Button
										onClick={() => add({net: '', suffix: '255.255.255.0'})}
										style={{width: '80%', marginLeft: '33%'}}
										icon={<PlusOutlined />}
									>
										添加授权网络
									</Button>
									<Form.ErrorList errors={errors} />
								</Form.Item>
							</>
						)}
					</Form.List>

					<Form.List name="hosts">
						{(fields, { add, remove }, { errors }) => (
							<>
								{fields.map((field, index) => (
									<Form.Item
										{...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
										label={index === 0 ? '授权主机/IP' : ''}
										tooltip={index === 0? '允许IP地址（例：192.168.1.10）或主机名（例：www.smart-core.cn）的列表。留空以允许所有。' : ''}
										required={false}
										key={field.key}
									>
										<Form.Item {...field} validateTrigger={['onChange', 'onBlur']} noStyle>
											<Input style={{width: '80%',}} />
										</Form.Item>
										{fields.length > 1 ? (<MinusCircleOutlined style={{fontSize: '18px', marginLeft: '5px'}} onClick={() => remove(field.name)}/>) : null}
									</Form.Item>
								))}
								<Form.Item>
									<Button
										onClick={() => add()}
										style={{width: '80%', marginLeft: '33%'}}
										icon={<PlusOutlined />}
									>
										添加授权主机/IP
									</Button>
									<Form.ErrorList errors={errors} />
								</Form.Item>
							</>
						)}
					</Form.List>


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
			</div>
		</div>
	);
}

export default NFSAuth;
