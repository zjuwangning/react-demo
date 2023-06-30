import React, { useEffect } from 'react';
import { Row, Col } from 'antd'


function User() {
	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {}
	}, []);

	return (
		<div className={'full-page'}>
			<Row style={{height: '3000px'}}></Row>
		</div>
	);
}

export default User;
