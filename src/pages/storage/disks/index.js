import React, { useRef } from 'react';
import { URL } from "../../../server/enum";
import BaseTablePage from "../../../component/TablePage";
import {Button, notification, Row} from "antd";
import { useNavigate } from "react-router-dom";

function Disk() {
	const navigate = useNavigate();
	const cRef = useRef(null)

	const initialization = record => {
		if (record && record['pool']) {
			notification.error({message: '该硬盘已配置存储池 无法初始化'});
			return ;
		}
		console.log('record', record);
		navigate('/storage/disks/initialization?identifier='+record.identifier)
	}

	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '4%',
			render: (t,r,i)=>i+1
		},
		{
			title: '位置(Enc-Slot)',
			dataIndex: 'enclosure',
			width: '10%',
			sorter: (a, b) => a.number - b.number,
			sortDirections: ['ascend'],
			defaultSortOrder: 'ascend',
			render: (t, r) => t.number+'-'+t.slot
		},
		{
			title: '类型',
			dataIndex: 'type',
			width: '10%'
		},
		{
			title: '容量',
			dataIndex: 'size',
			width: '12%',
			render: t=>(t/1024/1024/1024).toFixed(2)+' GiB'
		},
		{
			title: '型号',
			dataIndex: 'model',
			width: '20%'
		},
		{
			title: '序列号',
			dataIndex: 'serial',
			width: '14%'
		},
		{
			title: '角色',
			dataIndex: 'pool',
			width: '14%',
			render: t => t?t:'N/A'
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '12%',
			render: (t,r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'}>查找</Button>
						<Button type={'link'} size={'small'} onClick={()=>{initialization(r)}}>初始化</Button>
					</Row>
				)
			}
		},
	];


	return (
		<BaseTablePage
			ref={cRef}
			title={'硬盘列表'}
			subTitle={'显示物理硬盘盘列表的摘要，定位特定的物理硬盘，修改全局设置。'}
			url={URL.DISK_QUERY}
			columns={columns}
			params={[[], {extra: {pools: true}}]}
		/>
	);
}

export default Disk;
