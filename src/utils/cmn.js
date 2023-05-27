/**对象和数组相关的函数**/
/**
 * 深度拷贝, 防止因直接赋值引起的地址相同问题
 * @returns {*}
 */
export function cpy(o) {
	let res = {}
	switch (typeof o) {
		case "object":
			//判断o是否是react组件对象， 如果是 直接赋值
			if (!isEmpty(o) && o["$$typeof"] === Symbol.for('react.element')) {
				res = o
				break
			}
			if (Object.prototype.toString.call(o) === '[object Array]')
				res = []
			for (let i in o) {
				res[i] = cpy(o[i])
			}
			break
		default:
			res = o
			break
	}
	return res
}


/**
 * 数据是否为空判断函数
 * @param o
 * @returns {boolean}
 */
export function isEmpty(o) {
	if (o === null || o === undefined)
		return true
	switch (typeof o) {
		case "boolean":
			return false
		case "object":
			for (let t in o)
				return false
			return true
		case "array":
		case "string":
			return o.length <= 0
		case "number":
			return o.toString().length <= 0
		case "function":
			return false
		default:
			return true
	}
}


/**
 * json解析函数
 * @param str
 * @param default_result
 * @returns res
 */
export function json_decode(str, default_result = {}) {
	let res = default_result
	try {
		res = JSON.parse(str)
	} catch (e) {
	}
	return res
}


/**
 * 获取uuid
* @returns uuid
 */
export function getUUID () {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		return (c === 'x' ? (Math.random() * 16 | 0) : ('r&0x3' | '0x8')).toString(16)
	})
}

/**
 * 根据秒数计算时间
 * @returns string
 */
export const getTime = (seconds) => {
	if (seconds <= 60) return seconds+'秒'
	else if (seconds <= 3600) {
		let minutes = Math.floor(seconds/60)
		seconds = seconds%60
		return minutes+ '分钟 '+seconds+'秒'
	}
	else {
		let hours = Math.floor(seconds/3600)
		seconds = seconds%3600
		let minutes = Math.floor(seconds/60)
		seconds = seconds%60
		return hours+'小时 '+minutes+ '分钟 '+seconds+'秒'
	}
}

/**
 * 根据字节数计算容量
 * @returns string
 */
export const getVolume = (bytes, fix=2) => {
	if (isEmpty(bytes)) return ''
	else if (bytes+'' === '0') return '0';
	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	let flag = 0;
	while (bytes>1024) {
		bytes = bytes/1024;
		flag++;
		if (flag>=4) break;
	}
	return bytes.toFixed(fix)+' '+units[flag];
}

/**
 * 根据字节数计算带宽
 * @returns string
 */
export const getBandwidth = (bytes) => {
	if (isEmpty(bytes)) return ''
	else if (bytes+'' === '0') return '0';
	const units = ['', 'K', 'M', 'G', 'T']
	let flag = 0;
	bytes = Number(bytes);
	while (bytes>1024) {
		bytes = bytes/1024;
		flag++;
		if (flag>=4) break;
	}
	return bytes.toFixed(2)+' '+units[flag];
}

/**
 * 根据字节数计算iops
 * @returns string
 */
export const getIops = (bytes) => {
	if (isEmpty(bytes)) return ''
	else if (bytes+'' === '0') return '0';
	const units = ['', 'K', 'M', 'G', 'T']
	let flag = 0;
	bytes = Number(bytes);
	while (bytes>=1000) {
		bytes = bytes/1000;
		flag++;
		if (flag>=4) break;
	}
	return bytes.toFixed(2)+' '+units[flag];
}


/**
 * form体尾部布局 一般用于按钮
 * @returns object
 */
export const tailFormItemLayout = (offset=6) => {
	return {
		wrapperCol: {
			xs: {
				span: 24,
				offset: 0,
			},
			sm: {
				span: 24-offset,
				offset,
			},
		}
	}
};


/**
 * 通过拓扑结构获取raid类型
 * @returns string
 */
export 	const getRaid = t => {
	if (t['data'][0]['type'] === 'DISK') return 'RAID 0'
	else if (t['data'][0]['type'] === 'RAIDZ1') return 'RAID 5'
	else if (t['data'][0]['type'] === 'RAIDZ2') return 'RAID 6'
	else if (t['data'][0]['type'] === 'RAIDZ3') return 'RAID-TP'
	else if (t['data'][0]['type'] === 'MIRROR') {
		if (t['data'].length>1)  return 'RAID 10'
		else {
			if (t['data'][0]['children'].length === 2) return 'RAID 1'
			else if (t['data'][0]['children'].length > 2) return 'RAID 1E'
		}
	}
	else return t['data'][0]['type']
}



