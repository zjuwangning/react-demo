import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, notification, Modal, Form, Checkbox, InputNumber, Select, Input } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import {getUUID, isEmpty, tailFormItemLayout} from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let configSub = null,
	updateSub = null;
const keyList = ['port', 'loginattempt', 'clients', 'timeout_notransfer', 'ipconnections', 'timeout']

function Ftp() {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 数据集列表
	const [loading, setLoading] = useState(false);
	const [anonymous, setAnonymous] = useState(false);  // 是否允许匿名登录

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();

		return () => {
			PubSub.unsubscribe(configSub);
			PubSub.unsubscribe(updateSub);
		}
	}, []);

	// 获取ftp协议config数据
	const getData = () => {
		let uuid = getUUID();
		configSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '获取FTP配置错误，请稍后重试'})
			}
			else {
				let params = {}
				for (let k in keyList) {
					params[keyList[k]] = result[keyList[k]]
				}
				form.setFieldsValue(params)
			}
		})
		WebSocketService.call(uuid, URL.FTP_CONFIG, []);
	}

	//
	const handleSubmit = values => {
		console.log('values', values);

		Modal.confirm({
			title: '确认操作',
			content: '确认修改FTP配置',
			onOk() {
				return new Promise((resolve, reject) => {
					let uuid = getUUID();
					updateSub = PubSub.subscribe(uuid, (_, {result, error})=>{
						resolve();
						if (error) {
							notification.error({message: 'FTP设置错误'});
						}
						else {
							notification.success({message: 'FTP设置成功'});
							navigate('/share/protocol');
						}
					})
					WebSocketService.call(uuid, URL.FTP_UPDATE, [values]);
				}).catch(() => console.log('Oops errors!'));
			}
		})
	}

	// form数据变化
	const onDataChange = (changedValues, allValues) => {
		console.log('changedValues', changedValues);
		const changeKey = Object.keys(changedValues)[0]
		if (changeKey === 'onlyanonymous') {
			setAnonymous(changedValues[changeKey])
		}
	}

	//
	const suffixSelector = (
		<Form.Item name="suffix" noStyle>
			<Select style={{width: 70}} defaultValue={'MB'} options={[{label: 'MB', value: 'MB'},{label: 'GB', value: 'GB'},{label: 'TB', value: 'TB'}]}/>
		</Form.Item>
	);


	return (
		<>
			<div className={'full-page'}>
				<Row className={'title'}>SMB设置</Row>
				<Row className={'sub-title'}>修改系统的samba设置</Row>
				<Row className={'actions'} />
				<Row type={'flex'} style={{width: '770px'}}>
					<Form
						labelCol={{span: 10,}}
						wrapperCol={{span: 13,}}
						layout="horizontal"
						initialValues={{size: 'default',}}
						size={'default'}
						style={{width: 750}}
						form={form}
						onFinish={handleSubmit}
						onValuesChange={onDataChange}
					>
						<Row type={'flex'}>
							<Col span={12}>
								<Form.Item label="端口" name={'port'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'设置FTP服务监听的端口。'}>
									<InputNumber style={{width: '100%'}}/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item label="登录尝试" name={'loginattempt'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'输入客户端断开连接之前的最大尝试次数。如果用户容易出现错字，请增加此值。'}>
									<InputNumber style={{width: '100%'}}/>
								</Form.Item>
							</Col>
						</Row>
						<Row type={'flex'}>
							<Col span={12}>
								<Form.Item label="客户端数量" name={'clients'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'并发客户端的最大数量。'}>
									<InputNumber style={{width: '100%'}}/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item label="无传输超时" name={'timeout_notransfer'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'无发送/接收文件，或接收目录列表命令时，允许客户端连接的最大秒数。'}>
									<InputNumber style={{width: '100%'}}/>
								</Form.Item>
							</Col>
						</Row>
						<Row type={'flex'}>
							<Col span={12}>
								<Form.Item label="链接" name={'ipconnections'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'设置每个IP地址最大并发连接数。0表示无限制。'}>
									<InputNumber style={{width: '100%'}}/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item label="超时" name={'timeout'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'无控制或数据连接命令时，允许客户端连接的最大秒数。'}>
									<InputNumber style={{width: '100%'}}/>
								</Form.Item>
							</Col>
						</Row>
						<Row type={'flex'}>
							<Col span={12}>
								<Form.Item label="本地用户上传带宽" name={'localuserbw'}>
									<InputNumber addonAfter={suffixSelector}/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item label="本地用户下载带宽" name={'localuserdlbw'}>
									<InputNumber addonAfter={suffixSelector}/>
								</Form.Item>
							</Col>
						</Row>
						<Row type={'flex'}>
							<Col span={12}>
								<Form.Item label="允许匿名登录" name={'onlyanonymous'} valuePropName={'checked'} tooltip={'允许匿名FTP登录名访问路径中指定的目录。'}>
									<Checkbox />
								</Form.Item>
							</Col>
						</Row>
						{
							anonymous?(
								<Row type={'flex'}>
									<Col span={12}>
										<Form.Item label="路径" name={'anonpath'} rules={[{ required: true, message: '请填写工作组名称！' }]} tooltip={'设置匿名FTP连接的根目录。'}>
											<Input />
										</Form.Item>
									</Col>
								</Row>
							):""
						}
						{
							anonymous?(
								<Row type={'flex'}>
									<Col span={12}>
										<Form.Item label="匿名用户上传带宽" name={'anonuserbw'}>
											<InputNumber addonAfter={suffixSelector}/>
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item label="匿名用户下载带宽" name={'anonuserdlbw'}>
											<InputNumber addonAfter={suffixSelector}/>
										</Form.Item>
									</Col>
								</Row>
							):""

						}
						<Row type={'flex'}>
							<Col span={12}>
								<Form.Item label="允许本地用户登录" name={'onlylocal'} valuePropName={'checked'} tooltip={'允许任何本地用户登录。未勾选时，仅允许ftp组的成员登录。'}>
									<Checkbox />
								</Form.Item>
							</Col>
						</Row>
						<Form.Item {...tailFormItemLayout(5)}>
							<Button type="primary" htmlType="submit" loading={loading}>
								确定
							</Button>
							<Button style={{marginLeft: '2vw'}} onClick={()=>{navigate('/credentials/users')}}>
								取消
							</Button>
						</Form.Item>
					</Form>
				</Row>
			</div>
		</>
	);
}

export default Ftp;
