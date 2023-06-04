import React, { useEffect } from 'react';
import { Tabs } from "antd";
import DisksList from "./list";
import DisksSlot from "../../../component/DiskSlot";


function Disk() {

	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {}
	}, []);

	const items = [{key: '1', label: '硬盘列表', children: <DisksList/>, forceRender: true}, {key: '2', label: '硬盘槽位图', children: <DisksSlot/>, forceRender: true}]

	return (
		<div className={'full-page'}>
			<Tabs
				defaultActiveKey="1"
				type="card"
				size={'large'}
				items={items}
			/>
		</div>
	);
}

export default Disk;
