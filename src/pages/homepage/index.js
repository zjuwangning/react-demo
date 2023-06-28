import React, { useEffect } from 'react';
import { Row, Col } from 'antd'
import Panel from '../../component/Panel'
import Activities from './activities'


function Homepage() {
	// 获取页面可用宽度
	let screenInfo = {width: window.screen.availWidth, height: window.screen.availHeight};
	console.log('screenInfo', screenInfo);

	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {}
	}, []);

	return (
		<div className={'full-page'}>
			{/*<Panel title="活动日历" >*/}
				<Activities />
			{/*</Panel>*/}
		</div>
	);
}

export default Homepage;
