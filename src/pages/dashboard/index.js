import React, {useEffect, useState} from 'react';
import { Row, Col } from 'antd'
import Panel from '../../component/Panel'
import './index.less'


function Dashboard() {
	let screenInfo = {width: window.screen.availWidth, height: window.screen.availHeight};
	let width1 = 0, width2 = 0;
	// 左侧菜单200px  margin 26px*2 padding 25px*2  共302px  可用1920-302=1618px 计算一下页面窗体宽度
	if (screenInfo && screenInfo.width) {
		width1 = (screenInfo.width - 302 - 70)/3;
		width2 = (screenInfo.width - 302 - 50)/2;
	}
	else {
		window.location.href = '/login'
	}

	const [data, setData] = useState([])    // 显示机壳图

	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {

		}
	}, []);


	return (
		<div className={'full-page'}>
			<Row type={'flex'} justify={'start'} style={{width: '100%', minWidth: width2+20+'px', margin: 'auto'}}>
				<Col style={{width: width1+'px', height: width1*0.6+'px', marginRight: '20px', marginBottom: '20px'}}>
					<Panel title="Panel1" height={width1*0.6-40+'px'}>

					</Panel>
				</Col>
				<Col style={{width: width1+'px', height: width1*0.6+'px', marginRight: '20px', marginBottom: '20px'}}>
					<Panel title="Panel2" height={width1*0.6-40+'px'}>

					</Panel>
				</Col>
				<Col style={{width: width1+'px', height: width1*0.6+'px', marginBottom: '20px'}}>
					<Panel title="Panel3" height={width1*0.6-40+'px'}>

					</Panel>
				</Col>
			</Row>
			<Row type={'flex'} justify={'start'} style={{width: '100%', minWidth: width2+20+'px', margin: 'auto'}}>
				<Col style={{width: width2+'px', height: width2*0.5+'px', marginRight: '20px', marginBottom: '20px'}}>
					<Panel title="Panel4" height={width2*0.5-40+'px'}>

					</Panel>
				</Col>
				<Col style={{width: width2+'px', height: width2*0.5+'px', marginBottom: '20px'}}>
					<Panel title="Panel5" height={width2*0.5-40+'px'}>

					</Panel>
				</Col>
			</Row>
		</div>
	);
}

export default Dashboard;
