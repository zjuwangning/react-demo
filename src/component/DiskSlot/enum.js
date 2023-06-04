
// 2u 8盘位
const es_pos_2_8 = {}
const pos_es_2_8 = []

// 2u 12盘位
const es_pos_2_12 = {}
const pos_es_2_12 = []

// 2u 24盘位
const es_pos_2_24 = {}
const pos_es_2_24 = []

// 4u 36盘位
const es_pos_4_36 = {}
const pos_es_4_36 = []


// const es_pos_4_60 = {
// 	"2_25": 1, "2_26": 2, "2_27": 3, "2_28": 4, "2_29": 5, "2_30": 6,
// 	"2_19": 13, "2_20": 14, "2_21": 15, "2_22": 16, "2_23": 17, "2_24": 18,
// 	"2_13": 25, "2_14": 26, "2_15": 27, "2_16": 28, "2_17": 29, "2_18": 30,
// 	"2_7": 37, "2_8": 38, "2_9": 39, "2_10": 40, "2_11": 41, "2_12": 42,
// 	"2_1": 49, "2_2": 50, "2_3": 51, "2_4": 52, "2_5": 53, "2_6": 54,
//
// 	"3_25": 7, "3_26": 8, "3_27": 9, "3_28": 10, "3_29": 11, "3_30": 12,
// 	"3_19": 19, "3_20": 20, "3_21": 21, "3_22": 22, "3_23": 23, "3_24": 24,
// 	"3_13": 31, "3_14": 32, "3_15": 33, "3_16": 34, "3_17": 35, "3_18": 36,
// 	"3_7": 43, "3_8": 44, "3_9": 45, "3_10": 46, "3_11": 47, "3_12": 48,
// 	"3_1": 55, "3_2": 56, "3_3": 57, "3_4": 58, "3_5": 59, "3_6": 60,
// }

// 4u 60盘位 en-slot -> position
const es_pos_4_60 = {
	"2_1": {index: 48, title: 49}, "2_2": {index: 49, title: 50}, "2_3": {index: 50, title: 51},
	"2_4": {index: 51, title: 52}, "2_5": {index: 52, title: 53}, "2_6": {index: 53, title: 54},
	"2_7": {index: 36, title: 37}, "2_8": {index: 37, title: 38}, "2_9": {index: 38, title: 39},
	"2_10": {index: 39, title: 40}, "2_11": {index: 40, title: 41}, "2_12": {index: 41, title: 42},
	"2_13": {index: 24, title: 25}, "2_14": {index: 25, title: 26}, "2_15": {index: 26, title: 27},
	"2_16": {index: 27, title: 28}, "2_17": {index: 28, title: 29}, "2_18": {index: 29, title: 30},
	"2_19": {index: 12, title: 13}, "2_20": {index: 13, title: 14}, "2_21": {index: 14, title: 15},
	"2_22": {index: 15, title: 16}, "2_23": {index: 16, title: 17}, "2_24": {index: 17, title: 18},
	"2_25": {index: 0, title: '1'}, "2_26": {index: 1, title: 2}, "2_27": {index: 2, title: 3},
	"2_28": {index: 3, title: 4}, "2_29": {index: 4, title: 5}, "2_30": {index: 5, title: 6},
	"3_1": {index: 54, title: 55}, "3_2": {index: 55, title: 56}, "3_3": {index: 56, title: 57},
	"3_4": {index: 57, title: 58}, "3_5": {index: 58, title: 59}, "3_6": {index: 59, title: 60},
	"3_7": {index: 42, title: 43}, "3_8": {index: 43, title: 44}, "3_9": {index: 44, title: 45},
	"3_10": {index: 45, title: 46}, "3_11": {index: 46, title: 47}, "3_12": {index: 47, title: 48},
	"3_13": {index: 30, title: 31}, "3_14": {index: 31, title: 32}, "3_15": {index: 32, title: 33},
	"3_16": {index: 33, title: 34}, "3_17": {index: 34, title: 35}, "3_18": {index: 35, title: 36},
	"3_19": {index: 18, title: 19}, "3_20": {index: 19, title: 20}, "3_21": {index: 20, title: 21},
	"3_22": {index: 21, title: 22}, "3_23": {index: 22, title: 23}, "3_24": {index: 23, title: 24},
	"3_25": {index: 6, title: 7}, "3_26": {index: 7, title: 8}, "3_27": {index: 8, title: 9},
	"3_28": {index: 9, title: 10}, "3_29": {index: 10, title: 11}, "3_30": {index: 11, title: 12},
}
const pos_es_4_60 = [

]


// 1: 2u8  2: 2u12  3: 2u24  4: 4u36  5: 4u60
export const esp = [
	-1,
	{
		type: '2u 8盘位', slots: 8,
		es_pos: es_pos_2_8,
		pos_es: pos_es_2_8
	},
	{
		type: '2u 12盘位', slots: 12,
	},
	{
		type: '2u 24盘位', slots: 24,
	},
	{
		type: '4u 36盘位', slots: [24, 12],
		className: {box: ['box-4-0', 'box-4-1'], row: ['box-4-0-row', 'box-4-1-row'], item: 'item-4'},
		title: ['前面板', '后面板'],
		es_pos: es_pos_4_36,
		pos_es: pos_es_4_36
	},
	{
		type: '4u 60盘位', slots: 60,
		className: {box: 'box-5', row: 'box-5-row', item: 'item-5'},
		es_pos: es_pos_4_60,
		pos_es: pos_es_4_60
	}
]
