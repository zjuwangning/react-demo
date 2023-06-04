/**
 * Created by dell on 2020-04-14 15:27
 */
import { json_decode } from './cmn'

const Cache = {
	// 基础函数
	set:function (key, value) {
		sessionStorage.setItem(key, value);
	},
	get:function (key) {
		return sessionStorage.getItem(key) ? sessionStorage.getItem(key) : false;
	},
	remove:function(key) {
		sessionStorage.removeItem(key);
	},

	/* 用户相关 */
	saveUserInfo(user_info) {
		sessionStorage.setItem("user", JSON.stringify(user_info));
	},
	getUserInfo() {
		return json_decode(sessionStorage.getItem("user"));
	},
	removeUserInfo(){
		sessionStorage.removeItem("user");
	},

	// 获取用户token
	getUserToken:function () {
		let user_info = json_decode(sessionStorage.getItem("user"));
		return user_info && user_info.key ? user_info.key : -1;
	},

	// 记录登录信息 使用localStorage 用于记住密码功能
	saveLoginInfo(loginInfo) {
		localStorage.setItem("loginInfo", JSON.stringify(loginInfo));
	},
	// 获取登录信息
	getLoginInfo() {
		return json_decode(localStorage.getItem("loginInfo"));
	},
	// 移除登录信息
	removeLoginInfo() {
		localStorage.removeItem("loginInfo");
	},


	/* 显示相关 */
	// 保存显示器可用宽高
	saveScreenInfo(screen) {
		sessionStorage.removeItem("screenInfo");
		sessionStorage.setItem("screenInfo", JSON.stringify(screen));
	},
	// 获取显示器可用宽高
	getScreenInfo() {
		return json_decode(sessionStorage.getItem("screenInfo"));
	},
};

export default Cache
