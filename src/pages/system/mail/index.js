import React, { useEffect } from 'react';
import { Row, Tabs } from "antd";
import PubSub from "pubsub-js";
import Send from './send'
import Receive from './receive'
let fetchSub = null;  // 获取所有数据


function Mail() {

	// componentDidMount componentWillUnmount
	useEffect(() => {
		// getData();

		return () => {
			PubSub.unsubscribe(fetchSub);
		}
	}, []);

	const items = [{key: '1', label: '邮件发送方信息', children: <Send />}, {key: '2', label: '邮件接收方信息', children: <Receive />}]

	return (
		<div className={'full-page'}>
			<Row className={'title'}>邮件预警</Row>
			<Row className={'sub-title'}>设置邮件预警功能的发送方及接收方信息。</Row>
			<Tabs
				defaultActiveKey="1"
				type="card"
				size={'large'}
				items={items}
			/>
		</div>
	);
}

export default Mail;
