import React, {useEffect, useState} from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import {Layout, theme, Row, Col, notification, Button, Modal} from 'antd';
import Footer from "./component/Footer";
import Menu from "./component/FakeMenu";
import User from "./component/FakeUser";
import logo from '../images/logo.png'
import './index.css'
import {getUUID} from "../utils/cmn";
import PubSub from "pubsub-js";
import {WebSocketService} from "../server";
import {URL} from "../server/enum";
import Cache from "../utils/Cache";
import {useNavigate} from "react-router-dom";

const { Header, Sider, Content } = Layout;

let codeSub = null, observeSub = null, authSub = null;

const BasicLayout = () => {
	const navigate = useNavigate();

	const [collapsed, setCollapsed] = useState(false);
	const [authCode, setCode] = useState('');
	const [loading, setLoading] = useState(false);
	const {token: { colorBgContainer }} = theme.useToken();


	// componentDidMount
	useEffect(() => {
		getAuthCode();
		observeJob();

		return () => {
			PubSub.unsubscribe(codeSub);
			PubSub.unsubscribe(observeSub);
			PubSub.unsubscribe(authSub);
		}
	}, []);

	// 监听上传授权文件事件
	const observeJob = () => {
		observeSub = PubSub.subscribe(URL.FILE_LICENSE, (_, {result})=>{
			if (result['state'] === "FAILED") {
				Modal.error({title: 'errors', content: result['error']})
				setLoading(false);
			}
			else if (result['state'] === "SUCCESS") {
				setTimeout(authState, 3000);
			}
		})
	}

	// 授权判断 判断是否授权
	const authState = () => {
		const uuid = getUUID();
		authSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '授权文件校验失败，请检查文件后重新上传'})
				setLoading(false);
			}
			else {
				if (result && result['state'] === true) {
					notification.success({message: '授权文件校验成功'})
					navigate('/dashboard')
				}
				else if (result && result['state'] === false) {
					notification.error({message: '授权文件校验失败，请检查文件后重新上传'})
					setLoading(false);
				}
			}
		})
		WebSocketService.call(uuid, URL.LICENSE_VERIFY);
	}

	// 获取授权码
	const getAuthCode = () => {
		const uuid = getUUID();
		codeSub = PubSub.subscribe(uuid, (_, {error, result})=>{
			if (error) {
				notification.error({message: '获取授权出错，请联系管理员！'})
			}
			else {
				if (result && result['uuid']) {
					setCode(result['uuid'])
				}
			}
		})
		WebSocketService.call(uuid, URL.GET_LICENSE, );
	}

	// 上传授权文件
	const onUpload = () => {
		let fileDom = document.getElementById('files');
		if(fileDom.files[0] === undefined) {
			notification.warning({message: '尚未选择授权文件！'});
			return ;
		}
		if(fileDom.files[0]['size'] > 1000000) {
			notification.warning({message: '文件体积过大，请检查！'});
			return ;
		}

		const next = () => {
			let userInfo = Cache.getUserInfo();
			let url = '/_upload?auth_token='+userInfo['token']
			let formData = new FormData();
			let param = {method: "update.licensefile"}
			formData.append("data", JSON.stringify(param));
			formData.append("file", fileDom.files[0]);
			let xhr = new XMLHttpRequest();
			xhr.open('post', url);
			xhr.onload = function () {
				notification.success({message: '上传授权文件成功，等待校验中'})
				observeJob(JSON.parse(xhr.response)['job_id'])
			}
			xhr.onerror = function () {
				setLoading(false);
				notification.error({message: '上传文件出错，请稍后再试'});
			}
			setLoading(true);
			xhr.send(formData);
		}

		Modal.confirm({
			title: '确认操作',
			content: (<div>
				<Row>是否确认上传授权文件</Row>
				<Row>{fileDom.files[0]['name']}</Row>
			</div>),
			onOk: next
		})
	}

	return (
		<Layout>
			<Sider trigger={null} collapsible collapsed={collapsed} style={{height: '100vh', overflowY: 'auto'}}>
				{
					collapsed?(
						<Row type={'flex'} justify={'center'} align={'middle'} style={{height: '64px'}}><img src={logo} alt="" style={{height: '40px'}}/></Row>
					):(
						<Row type={'flex'} justify={'center'} align={'middle'} style={{height: '64px', width: '200px'}}>
							<img src={logo} alt="" style={{height: '40px'}}/>
							<span className={'menu-title'}>SmarStor</span>
						</Row>
					)
				}

				<Menu />
			</Sider>
			<Layout className="site-layout">
				<Header style={{padding: '0 10px', background: colorBgContainer,}}>
					<Row type={'flex'} justify={'space-between'} align={'middle'} style={{height: '100%'}}>
						<Col>
							{React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
								className: 'trigger',
								onClick: () => setCollapsed(!collapsed),
							})}
						</Col>
						<Col><User /></Col>
					</Row>
				</Header>
				<Content style={{margin: '0 26px'}}>
					<Row type={'flex'} align={'middle'} style={{height: '50px'}}>
						获取授权
					</Row>
					<div style={{ height: "calc(100vh - 145px)", padding: '12px 25px', background: colorBgContainer }}>
						<Row className={'title'}>获取授权</Row>
						<Row className={'sub-title'}>您尚未获取授权，请先根据授权码生成授权文件并上传</Row>

						<Row style={{marginTop: '40px'}}>授权码：{authCode}</Row>
						<Row type={'flex'} align={'middle'} style={{marginTop: '30px'}}>
							授权文件：
							<input id={'files'} type="file"/>
						</Row>
						<Row style={{marginTop: '30px'}}>
							<Button type={'primary'} onClick={onUpload} loading={loading}>上传授权文件</Button>
						</Row>
					</div>
					<Footer />
				</Content>
			</Layout>
		</Layout>
	);
};
export default BasicLayout;
