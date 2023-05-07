import React, { useEffect, useState } from 'react';
import { Row, Button, Input, notification, Table, Tag, DatePicker, Select } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../../server/enum";
import { getUUID, isEmpty, cpy } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import moment from "moment";
import dayjs from 'dayjs'

const { RangePicker } = DatePicker;
let fetchSub = null;  // 获取所有数据


function Logs() {
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
		getHostname();
		// getData();

		return () => {
			PubSub.unsubscribe(fetchSub);
		}
	}, []);

	// 获取所有数据集 及 数据集共享情况
	const getData = (flag = false) => {
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			setLoading(false);
			if (error) {
				notification.error({message: '数据获取失败'});
				setData([]);
			}
			else {
				if (flag) {
					let temp = [];
					for (let k in result) {
						let au = true;
						if (dateTime) {
							if (result[k]['datetime']['$date']<dayjs(dateTime[0]).hour(0).minute(0).second(0).valueOf()
								|| result[k]['datetime']['$date']>dayjs(dateTime[1]).add(1, 'd').hour(0).minute(0).second(0).valueOf())
							{
								au = false
							}
						}
						if (level) {
							if (result[k]['level'] !== level) {
								au = false
							}
						}
						if (content.length>0) {
							if (result[k]['formatted'].indexOf(content)<0) {
								au = false
							}
						}
						if (au) temp.push(result[k])
					}
					setData(temp);
				}
				else {
					setData(result);
				}
			}
		})
		WebSocketService.call(uuid, URL.LOGS_QUERY);
	}

	// 获取主机名称
	const getHostname = () => {
		setLoading(true);
		let uuid = getUUID();
		fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败'});
			}
			else {
				if (result && result['hostname']) {
					setHost(result['hostname'])
					getData();
				}
			}
		})
		WebSocketService.call(uuid, URL.NETWORK_GLOBAL_CONFIG);
	}

	//
	const search = () => {
		setLoading(true);
		getData(true)
	}

	// reset
	const reset = () => {
		setDate(null)
		setLevel(undefined)
		setContent('')
		getData(false)
	}

	//
	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			...sorter,
		});

		if (pagination.pageSize !== tableParams.pagination?.pageSize) {
			setData([]);
		}
	};

	//
	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '5%',
			render: (t,r,i)=>i+1
		},
		{
			title: '日期',
			dataIndex: 'datetime',
			width: '14%',
			render: t=>{if (t) return moment(t['$date']).format('YYYY-MM-DD HH:mm:ss'); else return ''},
			sorter: (a, b) => a['datetime']['$date'] - b['datetime']['$date'],
			defaultSortOrder: 'descend',
		},
		{
			title: '等级',
			dataIndex: 'level',
			width: '8%',
			render: t=> {
				let color = 'red', text = '错误'
				if (t === 'INFO' || t === 'NOTICE') {
					color = 'green';
					text = '信息'
				}
				else if (t === 'WARNING') {
					color = 'orange';
					text = '警报'
				}
				return (
					<Tag color={color}>{text}</Tag>
				)
			}
		},
		{
			title: '主机名称',
			dataIndex: 'hostname',
			width: '10%',
			render: ()=> hostname
		},
		{
			title: '消息',
			dataIndex: 'formatted',
			width: '63%',
		},
	];


	return (
		<div className={'full-page'}>
			<Row className={'title'}>系统日志</Row>
			<Row className={'sub-title'}>显示系统信息，及警报、错误日志。</Row>
			<Row className={'actions'} type={'flex'} align={'top'}>
				<RangePicker
					style={{width: '230px'}} allowClear
					value={dateTime}
					onChange={e=>setDate(e)}
				/>
				<Select
					style={{width: '120px', marginLeft: '10px'}}
					placeholder={'选择等级'} allowClear
					options={[{value: 'INFO', label: '信息'}, {value: 'WARNING', label: '警报'}, {value: 'CRITICAL', label: '错误'}]}
					value={level}
					onChange={e=>setLevel(e)}
				/>
				<Input
					style={{width: '230px', marginLeft: '10px'}}
					placeholder={'检索内容'} value={content} onChange={e=>setContent(e.target.value)}
				/>
				<Button type={'primary'} style={{marginLeft: '10px'}} onClick={search}>搜索</Button>
				<Button style={{marginLeft: '10px'}} onClick={reset}>重置</Button>
			</Row>
			<Table
				size={'middle'}
				columns={columns}
				rowKey={(record) => record.id || record.name}
				dataSource={data}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				childrenColumnName={'notallow'}
			/>
		</div>
	);
}

export default Logs;
