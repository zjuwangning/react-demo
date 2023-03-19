import React, {useRef} from 'react';
import {URL} from "../../../server/enum";
import BaseTablePage from "../../../component/TablePage";
import { Row, Col, Button, Progress, Tag } from "antd";
import {useNavigate} from "react-router-dom";
import {isEmpty} from "../../../utils/cmn";

function Pool() {
	const navigate = useNavigate();
	const cRef = useRef(null)

	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '5%',
			render: (t,r,i)=>i+1
		},
		{
			title: '名称',
			dataIndex: 'name',
			width: '9%'
		},
		{
			title: '状态',
			dataIndex: 'status',
			width: '11%',
			render: t => {
				let color = 'red'
				if (t === 'ONLINE') color='green'
				else if (t === 'DEGRADED') color='orange'
				return <Tag color={color}>{t}</Tag>
			}
		},
		{
			title: '容量',
			dataIndex: 'used',
			width: '48%',
			render: (t, r) => {
				let percent = 0
				if (!isEmpty(r['used']['parsed']) && !isEmpty(r['available']['parsed'])) {
					percent = r['used']['parsed']/(r['used']['parsed']+r['available']['parsed'])
					percent = (Number(percent)*100).toFixed(0)
				}
				return (
					<Row type={'flex'}>
						<Col span={12}>
							<Progress percent={percent} size="large" showInfo={false}/>
						</Col>
						<Col span={1}/>
						<Col span={11}>
							{r['used']['value']} 已使用（{percent}%）丨
							{r['available']['value']} 空闲
						</Col>
					</Row>
				)
			}
		},
		{
			title: 'RAID类型',
			dataIndex: 'topology',
			width: '10%',
			render: t => {
				if (!isEmpty(t) && !isEmpty(t['data'])) {
					return t['data'][0]['type']
				}
			}
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '17%',
			render: (t,r)=>{
				return (
					<Row type={'flex'}>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/storage/pools/create')}}>查看</Button>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/storage/pools/scrub?id='+r['id'])}}>校验</Button>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/storage/pools')}}>修改</Button>
						<Button type={'link'} size={'small'} onClick={()=>{navigate('/storage/pools')}}>删除</Button>
					</Row>
				)
			}
		},
	];

	const actions = <Button type={'primary'} onClick={()=>{navigate('/storage/pools/create')}}>新建</Button>

	const filters = item => {
		return item['id'].indexOf('/')<0;
	}

	return (
		<BaseTablePage
			ref={cRef}
			title={'存储池列表'}
			subTitle={'显示所有磁盘池的摘要，删除或者定位特定磁盘池。'}
			url={[URL.POOL_QUERY, URL.DATASET_QUERY]}
			match={['name', 'id']}
			merge={['used', 'available']}
			columns={columns}
			actions={actions}
			// filters={filters}
		/>
	);
}

export default Pool;
