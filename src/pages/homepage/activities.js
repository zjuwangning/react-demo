import React, { useEffect } from 'react';
import { Row, Col, Calendar, Select, Typography, Radio } from 'antd'
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import dayLocaleData from 'dayjs/plugin/localeData';
dayjs.extend(dayLocaleData);

function Activities() {
	// componentDidMount componentWillUnmount
	useEffect(() => {

		return () => {}
	}, []);

	return (
		<Row type={'flex'} style={{width: '100%'}}>
			<Calendar
				headerRender={({ value, type, onChange, onTypeChange }) => {
					console.log('value', value);
					const start = 0;
					const end = 12;
					const monthOptions = [];
					for (let i = start; i < end; i++) {
						monthOptions.push(
							<Select.Option key={i} value={i} className="month-item">
								{i+1+'月'}
							</Select.Option>,
						);
					}
					const year = value.year();
					const month = value.month();
					const options = [];
					for (let i = year - 10; i < year + 10; i += 1) {
						options.push(
							<Select.Option key={i} value={i} className="year-item">
								{i}
							</Select.Option>,
						);
					}
					return (
						<div
							style={{
								padding: 8,
							}}
						>
							<Row gutter={8}>
								<Col>
									<Select
										size="small"
										dropdownMatchSelectWidth={false}
										className="my-year-select"
										value={year}
										onChange={(newYear) => {
											const now = value.clone().year(newYear);
											onChange(now);
										}}
									>
										{options}
									</Select>
								</Col>
								<Col>
									<Select
										size="small"
										dropdownMatchSelectWidth={false}
										value={month}
										onChange={(newMonth) => {
											const now = value.clone().month(newMonth);
											onChange(now);
										}}
									>
										{monthOptions}
									</Select>
								</Col>
							</Row>
						</div>
					);
				}}
			/>
		</Row>
	);
}

export default Activities;
