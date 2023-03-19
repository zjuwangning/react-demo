import React, { useEffect, useState } from 'react';
import { Row, Button, Select, Input, Form, Radio, notification } from 'antd'
import { useNavigate } from "react-router-dom";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { WebSocketService } from "../../../server";
import { getUUID, isEmpty } from "../../../utils/cmn";


function PoolCreate() {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate();

	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {

		}

		return () => {}
	}, []);

	const handleSubmit = values => {

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
			<Row className={'title'}>新建存储池</Row>
			<Row className={'sub-title'}>创建新的存储池</Row>
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
					<Form.Item label="名称" name="name" rules={[{required: true, message: '请输入名称！', whitespace: true}]}>
						<Input />
					</Form.Item>
					<Form.Item label="介质类型" name="type" rules={[{required: true, message: '请选择介质类型！'}]}>
						<Radio.Group>
							<Radio value="a">HDD+SSD</Radio>
							<Radio value="b">HDD</Radio>
							<Radio value="c">SSD</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item label="数据盘选择" name="disk" rules={[{required: true, message: '请选择数据盘！'}]}>
						<Select
							mode="multiple"
							allowClear
							style={{width: '100%',}}
							placeholder="请选择数据盘"
							options={[{label: '1', value: '1'}, {label: '2', value: '2'}, {label: '3', value: '3'}, {label: '4', value: '4'}]}
						/>
					</Form.Item>
					<Form.Item label="缓存盘选择" name="cache" rules={[{required: true, message: '请选择缓存盘！'}]}>
						<Select
							mode="multiple"
							allowClear
							style={{width: '100%',}}
							placeholder="请选择缓存盘"
							options={[{label: '1', value: '1'}, {label: '2', value: '2'}, {label: '3', value: '3'}, {label: '4', value: '4'}]}
						/>
					</Form.Item>
					<Form.Item label="RAID级别" name="raid" rules={[{required: true, message: '请选择RAID级别！'}]}>
						<Select
							style={{width: '100%',}}
							placeholder="请选择RAID级别"
							options={[{label: '1', value: '1'}, {label: '2', value: '2'}, {label: '3', value: '3'}, {label: '4', value: '4'}]}
						/>
					</Form.Item>

					<Form.Item label="热备盘选择" name="backup" rules={[{required: true, message: '请选择热备盘！'}]}>
						<Select
							mode="multiple"
							allowClear
							style={{width: '100%',}}
							placeholder="请选择热备盘"
							options={[{label: '1', value: '1'}, {label: '2', value: '2'}, {label: '3', value: '3'}, {label: '4', value: '4'}]}
						/>
					</Form.Item>
					<Form.Item {...tailFormItemLayout}>
						<Button type="primary" htmlType="submit" loading={loading}>
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/storage/pools')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default PoolCreate;
