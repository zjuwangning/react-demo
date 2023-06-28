import React, { useEffect } from 'react';


function Homepage() {

	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {}
	}, []);

	return (
		<div className={'full-page'}>
			homepage
		</div>
	);
}

export default Homepage;
