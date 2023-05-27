import React, { useEffect, useState } from 'react';
import {Row, Button, Input, notification, Table, Tag, Modal, Form, InputNumber, Select, Checkbox, Popover} from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty, cpy, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import {PlusOutlined} from "@ant-design/icons";

let fetchSub = null, createSub = null, editSub = null, delSub = null, testSub = null, taskSub = null;  // 获取所有数据

function Receive() {
	const [form] = Form.useForm();
	const [data, setData] = useState([]);           // 表格数据
	const [loading, setLoading] = useState(false);  // loading状态
	const [title, setTitle] = useState('');         // 弹窗标题
	const [open, setOpen] = useState(false);        // 弹窗open
	const [record, setRecord] = useState({});       // 编辑的item
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 10,
		},
	});

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();

		return () => {
			PubSub.unsubscribe(fetchSub);
			PubSub.unsubscribe(createSub);
			PubSub.unsubscribe(editSub);
			PubSub.unsubscribe(delSub);
			PubSub.unsubscribe(testSub);
			PubSub.unsubscribe(taskSub);
		}
	}, []);

	//
	const getData = () => {
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '预警数据获取错误'})
			}
			else {
				let temp = []
				if (result && result.length>0) {
					temp = result
				}
				setData(temp)
			}
		})
		WebSocketService.call(uuid, URL.ALERT_QUERY);
	}

	// 新增预警数据
	const add = () => {
		form.resetFields();
		setTitle('添加预警服务');
		setRecord({});
		setOpen(true);
	}

	// 编辑预警数据
	const edit = r => {
		let temp = {}
		temp['name'] = r['name'];
		temp['email'] = r['attributes']['email'];
		temp['level'] = r['level'];
		temp['enabled'] = r['enabled'];
		form.setFieldsValue(temp)
		setTitle('编辑预警服务');
		setRecord(r);
		setOpen(true);
	}

	// 删除预警语句
	const del = r => {
		Modal.confirm({
			title: '删除邮件预警',
			content: '是否确认删除邮件预警 '+r['name'],
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					delSub = PubSub.subscribe(uuid, (_, {error})=>{
						resolve();
						if (error) {
							notification.error({message: '删除失败，请稍后重试！'});
						}
						else {
							notification.success({message: '删除成功'});
							getData();
						}
					})
					WebSocketService.call(uuid, URL.ALERT_DELETE, [r['id']]);
				}).catch(() => console.error('Oops errors!'));
			}
		})
	}

	//
	const handleSubmit = () => {
		form.validateFields().then((values)=>{
			if (title === '添加预警服务') {
				saveCreate(values)
			}
			else if (title === '编辑预警服务') {
				saveEdit(values)
			}
		})
	}

	// 创建数据
	const saveCreate = values => {
		PubSub.unsubscribe(createSub);
		let params = generateData(values);
		setLoading(true);
		let uuid = getUUID();
		createSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			setLoading(false);
			if (error) {
				Modal.error({title: '保存错误', content: error.reason});
			}
			else {
				notification.success({message: '数据保存成功'})
				getData();
				setOpen(false)
			}
		})
		WebSocketService.call(uuid, URL.ALERT_CREATE, [params]);
	}

	// 编辑数据
	const saveEdit = values => {
		PubSub.unsubscribe(editSub);
		let params = generateData(values);
		setLoading(true);
		let uuid = getUUID();
		editSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			setLoading(false);
			if (error) {
				Modal.error({title: '保存错误', content: error.reason});
			}
			else {
				notification.success({message: '数据保存成功'})
				getData();
				setOpen(false)
			}
		})
		WebSocketService.call(uuid, URL.ALERT_UPDATE, [record['id']+'', params]);
	}

	// 拼接变量
	const generateData = values => {
		let temp = values;
		temp['enabled'] = !!temp['enabled'];
		temp['type'] = "Mail";
		temp['attributes'] =  {email: temp['email']};
		delete temp['email']
		return temp
	}

	// 发送测试邮件
	const sendTest = () => {
		form.validateFields().then((values)=>{
			setLoading(true);
			PubSub.unsubscribe(testSub);
			let params = generateData(values);
			let uuid = getUUID();
			testSub = PubSub.subscribe(uuid, (_, {error, result})=>{
				if (error) {
					Modal.error({title: '测试错误', content: error.reason});
				}
				else {
					sendProgress()
				}
			})
			WebSocketService.call(uuid, URL.ALERT_TEST, [params]);
		})
	}

	// 监听发送任务
	const sendProgress = () => {
		PubSub.unsubscribe(taskSub);
		taskSub = PubSub.subscribe(URL.MAIL_SEND, (_, {result})=>{
			if (result['state'] === 'SUCCESS') {
				setLoading(false);
				notification.success({message: '发送测试邮件成功'});
			}
			else if (result['state'] === 'FAILED') {
				setLoading(false);
				Modal.error({
					title: '发送测试邮件错误',
					content: result.error
				})
			}
		})
	}

	//
	const handleTableChange = (pagination, filters, sorter) => {
		if (pagination.pageSize !== tableParams.pagination?.pageSize) {
			pagination.current = 1;
		}
		setTableParams({
			pagination,
			filters,
			...sorter,
		});
	};

	//
	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '8%',
			render: (t,r,i)=>i+1
		},
		{
			title: '预警名称',
			dataIndex: 'name',
			width: '12%',
		},
		{
			title: '接收人邮件地址',
			dataIndex: 'attributes',
			width: '21%',
			render: t => t['email']
		},
		{
			title: '报警级别',
			dataIndex: 'level',
			width: '12%',
			render: t=> {
				let color = 'red', text = '错误'
				if (t === 'INFO' || t === 'NOTICE') {
					color = 'green';
					text = '信息'
				}
				else if (t === 'WARNING') {
					color = 'orange';
					text = '警报'
				}
				return (
					<Tag color={color}>{text}</Tag>
				)
			}
		},
		{
			title: '是否启用',
			dataIndex: 'enabled',
			width: '12%',
			render: t => t?'是':'否'
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '15%',
			render: (t, r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{edit(r)}}>编辑</Button>
						<Button type={'link'} size={'small'} onClick={()=>{del(r)}}>删除</Button>
					</Row>
				)
			}
		},
	];

	return (
		<Row type={'flex'} style={{width: '900px'}}>
			<Table
				size={'middle'}
				style={{width: '880px'}}
				columns={columns}
				rowKey={(record) => record.id || record.name}
				dataSource={data}
				pagination={tableParams.pagination}
				onChange={handleTableChange}
				childrenColumnName={'notallow'}
				footer={() => <Row type={'flex'} justify={'center'} style={{cursor: 'pointer'}} onClick={add}><PlusOutlined style={{fontSize: '18px'}} /></Row>}
			/>
			<Modal
				title={title}
				open={open}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button onClick={sendTest} loading={loading}>发送测试邮件</Button>
						<Button onClick={()=>{setOpen(false)}} loading={loading}>取消</Button>
						<Button type={'primary'} onClick={handleSubmit} loading={loading}>保存</Button>
					</Row>
				)}
				onCancel={()=>{setOpen(false)}}
			>
				<Form
					labelCol={{span: 6,}}
					wrapperCol={{span: 17,}}
					layout="horizontal"
					initialValues={{size: 'default',}}
					size={'default'}
					style={{width: "100%", marginTop: '25px'}}
					form={form}
				>
					<Form.Item label="预警名称" name={'name'} rules={[{ required: true, message: '请输入预警名称！'}]}>
						<Input />
					</Form.Item>
					<Form.Item label="接收人邮件地址" name={'email'} rules={[{ required: true, message: '请输入接收人邮件地址！'}]}>
						<Input />
					</Form.Item>
					<Form.Item label="告警级别" name={'level'} rules={[{ required: true, message: '请选择告警级别！'}]}>
						<Select options={[{label: '信息', value: 'INFO'}, {label: '警报', value: 'WARNING'}, {label: '错误', value: 'ERROR'}]}/>
					</Form.Item>
					<Form.Item label="是否启用" name={'enabled'} valuePropName={'checked'}>
						<Checkbox />
					</Form.Item>
				</Form>
			</Modal>
		</Row>
	);
}

export default Receive;
