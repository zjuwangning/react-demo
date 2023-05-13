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
import Volume from "./Volume";



function Ring({ data = [], content = {}, intervalConfig = {} }) {
	const brandFill = getTheme().colors10[0];
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
					color={["type", [brandFill, "#eee"]]}
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
						fill: brandFill,
						textAlign: "center",
					}}
				/>
			</View>
		</Chart>
	);
}

export default Ring;
