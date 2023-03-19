import React, {useEffect, useState} from 'react';
import { Button, Form, Row, Select, Progress } from 'antd'
import PubSub from "pubsub-js";
import { getUUID, isEmpty } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import { URL } from "../../../server/enum";
import { useNavigate, useSearchParams } from "react-router-dom";


function Initial() {
	let diskSub = null;
	const navigate = useNavigate();
	const [search] = useSearchParams();
	const [form] = Form.useForm();
	const [item, setItem] = useState({})
	const [loading, setLoading] = useState(false)

	// componentDidMount componentWillUnmount
	useEffect(() => {
		let uuid = getUUID();
		if (search.get('identifier')) {
			WebSocketService.call(uuid, URL.DISK_QUERY, [[["identifier", "=", search.get('identifier')]]]);
			diskSub = PubSub.subscribe(uuid, (_, data)=>{
				if (!isEmpty(data) && !isEmpty(data[0])) {
					console.log('data[0]', data[0]);
					setItem(data[0])
					form.setFieldsValue({group: data[0]['group']['id']})
				}
			})
		}

		return () => {
			PubSub.unsubscribe(diskSub);
		}
	}, []);


	// handleSubmit
	const handleSubmit = values => {
		setLoading(true);
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
			<Row className={'title'}>硬盘初始化</Row>
			<Row className={'sub-title'}>擦除硬盘</Row>
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

					<Form.Item label="序列号">
						{item['serial']}
					</Form.Item>
					<Form.Item label="擦除方法" name={'method'} rules={[{ required: true, message: '请选择擦除方法！' }]}>
						<Select options={[{label: '快速', value: '1'}, {label: '用0进行填充', value: '1'}]} />
					</Form.Item>
					<Form.Item label="进度" name={'progress'}>
						<Progress percent={50} size="small" status="active" />
					</Form.Item>
					<Form.Item {...tailFormItemLayout}>
						<Button type="primary" htmlType="submit" loading={loading}>
							确定
						</Button>
						<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/storage/disks')}}>
							取消
						</Button>
					</Form.Item>
				</Form>
			</Row>
		</div>
	);
}

export default Initial;
