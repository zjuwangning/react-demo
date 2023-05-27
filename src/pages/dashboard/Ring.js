import React from "react";
import {
	Chart,
	Interval,
	Axis,
	Tooltip,
	Coordinate,
	Legend,
	View,
	Annotation,
	getTheme,
} from "bizcharts";



function Ring({ data = [], content = {}, intervalConfig = {}, color='#5B8FF9' }) {
	return (
		<Chart placeholder={false} height={200} padding="auto" autoFit>
			<Legend visible={false} />
			{/* 绘制图形 */}
			<View
				data={data}
				scale={{
					percent: {
						formatter: (val) => {
							return (val * 100).toFixed(2) + "%";
						},
					},
				}}
			>
				<Coordinate type="theta" innerRadius={0.75} />
				<Interval
					position="percent"
					adjust="stack"
					color={["type", [color, "#eee"]]}
					size={16}
					{...intervalConfig}
				/>
				<Annotation.Text
					position={["50%", "48%"]}
					content={content.title}
					style={{
						lineHeight: "240px",
						fontSize: "16",
						fill: "#000",
						textAlign: "center",
					}}
				/>
				<Annotation.Text
					position={["50%", "62%"]}
					content={content.percent}
					style={{
						lineHeight: "240px",
						fontSize: "24",
						fill: color,
						textAlign: "center",
					}}
				/>
			</View>
		</Chart>
	);
}

export default Ring;
