import React, {useEffect, useState} from 'react';
import {Row, Col, notification} from 'antd'
import {useNavigate} from "react-router-dom";
import PubSub from "pubsub-js";
import Footer from "./component/Footer";
import logo from "../images/logo.png";
import {getUUID} from "../utils/cmn";
import {WebSocketService} from "../server";
import {URL} from "../server/enum";
import './index.css'

let timer = null;
let rebootSub = null;

const RebootLayout = () => {
	const navigate = useNavigate();


	useEffect(() => {
		ellipsisDots();
		reboot();

		return () => {
			clearInterval(timer);
			timer = null;
			PubSub.unsubscribe(rebootSub);
		}

	}, [])

	// 发送重启命令
	const reboot = () => {
		let uuid = getUUID();
		rebootSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '系统重启失败，请稍后再试！'})
				navigate('/login');
			}
			else {
				WebSocketService.prepareShutdown();
				setTimeout(() => {
					notification.error({message: '系统重启成功！'})
					navigate('/login');
				}, 5000);
			}
		})
		WebSocketService.call(uuid, URL.SYSTEM_REBOOT);
	}

	// 动态显示省略号
	const ellipsisDots = () => {
		if (timer!==null) {
			clearInterval(timer);
			timer = null;
		}
		timer = setInterval(()=>{
			let ele = document.getElementById('dots');
			let dots = ele.innerText
			dots += '.'
			if (dots.length>6) dots = '.'
			ele.innerText = dots
		}, 300)
	}

	return (
		<div className={'reboot-page'}>
			<Row style={{height: '50px'}}/>
			<div className={'reboot-card'}>
				<Row type={'flex'}>
					<Col><img src={logo} alt="" style={{height: '120px', marginTop: '15px'}}/></Col>
					<Col>
						<Row className={'reboot-title'}>SmarStor NAS</Row>
						<Row className={'reboot-sub-title'}>Storage manager</Row>
					</Col>
				</Row>
				<Row type={'flex'} className={'reboot-foot-title'}>
					系统重启中<span id={'dots'}>.</span>
				</Row>
			</div>
			<Footer />
		</div>
	);
};
export default RebootLayout;
