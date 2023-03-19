import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Table, Row } from 'antd'
import PubSub from "pubsub-js";
import {getUUID, isEmpty} from "../../utils/cmn";
import { WebSocketService } from "../../server";
import './index.css'

const BaseTablePage = forwardRef((
	{
		title='', subTitle='', url='', columns=[],
		actions = <></>, filters=null, sort=null,
		merge=[], match=[], params=''
	},
	ref
) => {
	// 暴露给父节点的方法
	useImperativeHandle(ref, () => ({
		fetchData: fetchData,
		mergeData: mergeData,
		setTableLoading: setLoading,
	}))

	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 10,
		},
	});

	let fetchSub = null;

	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (typeof url === 'string') {
			fetchData(url);
		}
		else if (url.length === 1) {
			fetchData(url[0]);
		}
		else {
			mergeData(url)
		}
	}, [JSON.stringify(tableParams)]);

	useEffect(() => {
		return () => {
			PubSub.unsubscribe(fetchSub);
		}
	}, []);

	// sort 额外设定的排序规则 暂时可以通过columns排序解决 columns无法解决时 需要额外设定排序
	const fetchData = fetchUrl => {
		setLoading(true);
		const uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, data)=>{
			setLoading(false);
			let temp = [];
			if (filters) {
				for (let k in data) {
					if (filters(data[k])) {
						temp.push(data[k])
					}
				}
			}
			else temp = data || [];
			setData(temp);
			setTableParams({
				...tableParams,
				pagination: {
					...tableParams.pagination,
					total: temp.length,
				},
			});
		})
		if (isEmpty(params)) WebSocketService.call(uuid, fetchUrl);
		else WebSocketService.call(uuid, fetchUrl, params);
	}

	const mergeData = fetchUrl => {
		setLoading(true);
		const uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, data)=>{
			let temp = [];
			if (filters) {
				for (let k in data) {
					if (filters(data[k])) {
						temp.push(data[k])
					}
				}
			}
			else temp = data || [];
			const newUUID = getUUID();
			WebSocketService.call(newUUID, fetchUrl[1]);
			fetchSub = PubSub.subscribe(newUUID, (_, data)=>{
				for (let k in temp) {
					for (let m in data) {
						if (temp[k][match[0]]+'' === data[m][match[1]]) {
							for (let n in merge) {
								temp[k][merge[n]] = data[m][merge[n]]
							}
						}
					}
				}
				setLoading(false);
				setData(temp);
				setTableParams({
					...tableParams,
					pagination: {
						...tableParams.pagination,
						total: temp.length,
					},
				});
			})
		})
		if (isEmpty(params)) WebSocketService.call(uuid, fetchUrl[0]);
		else WebSocketService.call(uuid, fetchUrl[0], params);
	}

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			...sorter,
		});

		// `dataSource` is useless since `pageSize` changed
		if (pagination.pageSize !== tableParams.pagination?.pageSize) {
			setData([]);
		}
	};


	return (
		<div className={'full-page'}>
			<Row className={'title'}>{title}</Row>
			<Row className={'sub-title'}>{subTitle}</Row>
			<Row className={'actions'}>{actions}</Row>
			<Table
				size={'middle'}
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={data}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				childrenColumnName={'notallow'}
			/>
		</div>
	);
})

export default BaseTablePage;
