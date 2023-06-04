import React from "react";
import { Chart, Interval, Coordinate, Legend, View, Annotation } from "bizcharts";



function Ring({ data = [], content = {}, intervalConfig = {}, color='#5B8FF9', height=230 }) {

	return (
		<Chart placeholder={false} height={height} padding="auto" autoFit={true} forceUpdate={true}>
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
						fontSize: height/14+'',
						fill: "#000",
						textAlign: "center",
					}}
				/>
				<Annotation.Text
					position={["50%", "62%"]}
					content={content.percent}
					style={{
						lineHeight: "240px",
						fontSize: height/10+'',
						fill: color,
						textAlign: "center",
					}}
				/>
			</View>
		</Chart>
	);
}

export default Ring;
