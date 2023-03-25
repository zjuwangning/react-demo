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



