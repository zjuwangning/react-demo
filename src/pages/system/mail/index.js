import React, { useEffect, useState } from 'react';
import { Row, Button, Input, notification, Table, Tag, DatePicker, Tabs } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID, isEmpty, cpy } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import Send from './send'
import Receive from './receive'

const { RangePicker } = DatePicker;
let fetchSub = null;  // 获取所有数据
const levelValue = {'INFO': '信息', 'WARNING': '警报', 'CRITICAL': '错误'}


function Mail() {
	const [data, setData] = useState([]);       // 数据集列表
	const [hostname, setHost] = useState('');   // 获取主机名
	const [dateTime, setDate] = useState('');   // 要检索的时间
	const [level, setLevel] = useState(undefined);     // 要检索的等级
	const [content, setContent] = useState(''); // 要检索的内容
	const [loading, setLoading] = useState(false);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 10,
		},
	});

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
