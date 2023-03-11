import React, {useRef} from 'react';
import {URL} from "../../../server/enum";
import BaseTablePage from "../../../component/TablePage";
import {Button, Row} from "antd";

function Disk() {
	const cRef = useRef(null)




	const columns = [
		{
			title: '序号',
			dataIndex: 'index',
			width: '8%',
			render: (t,r,i)=>i+1
		},
		{
			title: '操作',
			dataIndex: 'operation',
			width: '23%',
			render: (t, r) => <Button type={'link'} size={'small'}>查找</Button>
		},
	];

	const actions = <Button type={'primary'} >查找</Button>

	return (
		<BaseTablePage
			ref={cRef}
			title={'硬盘列表'}
			subTitle={'显示物理硬盘盘列表的摘要，定位特定的物理硬盘，修改全局设置。'}
			url={URL.USER_QUERY}
			columns={columns}
			actions={actions}
		/>
	);
}

export default Disk;
