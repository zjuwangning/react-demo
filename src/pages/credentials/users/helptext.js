import {isEmpty} from "../../../utils/cmn";

export const usernameValidator = (_, value) => {
	const reg = /^[a-zA-Z0-9]{4,16}$/
	if (isEmpty(value)) {
		return Promise.resolve();
	}
	if (reg.test(value)) {
		return Promise.resolve();
	}
	return Promise.reject();
}

export const passwordValidator = (_, value) => {
	const reg = /^[a-zA-Z0-9]{6,16}$/
	if (isEmpty(value)) {
		return Promise.resolve();
	}
	if (reg.test(value)) {
		return Promise.resolve();
	}
	return Promise.reject();
}

export const tipsText = {
	usernameTips: '用户名长度为4-16个字符，且只能包含数字、大小写字母。为了保持兼容性，用户名建议4-8字符。',
	usernameMsg: '用户名长度为4-16个字符，且只能包含数字、大小写字母',
	usernameInUse: '该用户名已被使用',
	usernameRequire: '请输入您的用户名',
	passwordMsg: '密码长度为6-16且只能包含数字、大小写字母',
	passwordRequire: '请输入您的密码',
}
