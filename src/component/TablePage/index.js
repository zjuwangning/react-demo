import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Table, Row } from 'antd'
import PubSub from "pubsub-js";
import {getUUID, isEmpty} from "../../utils/cmn";
import { WebSocketService } from "../../server";
import './index.css'

let fetchSub = null;

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

	// componentDidMount componentWillUnmount
	useEffect(() => {
		fetchData(url);

		return () => {
			PubSub.unsubscribe(fetchSub);
		}
	}, []);

	// sort 额外设定的排序规则 暂时可以通过columns排序解决 columns无法解决时 需要额外设定排序
	const fetchData = fetchUrl => {
		setLoading(true);
		const uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result})=>{
			setLoading(false);
			let temp = [];
			if (filters) {
				for (let k in result) {
					if (filters(result[k])) {
						temp.push(result[k])
					}
				}
			}
			else temp = result || [];
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


	return (
		<div className={'full-page'}>
			<Row className={'title'}>{title}</Row>
			<Row className={'sub-title'}>{subTitle}</Row>
			<Row className={'actions'}>{actions}</Row>
			<Table
				size={'middle'}
				columns={columns}
				rowKey={(record) => record.id || record.serial}
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
