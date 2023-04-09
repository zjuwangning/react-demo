import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Row, Button, Modal, notification, Table } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";

let fetchSub = null;

function WebDav() {
	const navigate = useNavigate();

	const [data, setData] = useState([]);   // 数据集列表
	const [loading, setLoading] = useState(false);

	// componentDidMount componentWillUnmount
	useEffect(() => {
		getData();

		return () => {
			PubSub.unsubscribe(fetchSub);
		}
	}, []);

	// 获取共享协议
	const getData = () => {
		setLoading(true);
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			setLoading(false);
			if (error) {
				notification.error({message: '数据获取错误，请稍后重试'});
			}
			else {
				console.log('result', result);
				let temp = [];
				for (let k in result) {
					if (['ftp', 'cifs', 'nfs', 'webdav'].includes(result[k]['service'])) temp.push(result[k])
				}
				setData(temp);
			}
		})
		WebSocketService.call(uuid, URL.SERVICE_QUERY);
	}



	return (
		<>
			<div className={'full-page'}>
				<Row className={'title'}>WebDAV设置</Row>
				<Row className={'sub-title'}>修改系统的WebDAV设置</Row>
				<Row className={'actions'} />

			</div>
		</>
	);
}

export default WebDav;
