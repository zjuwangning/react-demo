import PubSub from 'pubsub-js'
import environment from './environment'
import { EventMessage, URL } from './enum'
import { getUUID, isEmpty } from '../utils/cmn'
import Cache from "../utils/Cache";


class Socket {
	constructor() {
		this.protocol = window.location.protocol;
		this.remote = environment.remote;
		this.pendingMessages = [];
		this.shuttingdown = false;      // 准备关闭socket 后续会用到
		this.onToken = false;
		this.token = null;
		const userInfo = Cache.getUserInfo();
		// 解决页面刷新问题 刷新后进行token验证 验证通过重置token 不通过则跳转登录页面重新登录 以免遇到获取数据错误问题
		if (userInfo && userInfo['token']) {
			this.onToken = true;
			this.token = userInfo['token'];
		}
		this.connect();
	}

	connect() {
		this.socket = new WebSocket(
			(this.protocol === 'https:' ? 'wss://' : 'ws://')
			+ this.remote + '/websocket',
		);
		this.socket.onmessage = this.onMessage.bind(this);
		this.socket.onopen = this.onOpen.bind(this);
		this.socket.onclose = this.onClose.bind(this);
	}

	//
	onOpen() {
		this.socket.send(JSON.stringify({ msg: EventMessage.Connect, version: '1', support: ['1'] }))
	}

	//
	onConnect() {
		this.shuttingdown = false;
		while (this.pendingMessages.length > 0) {
			const payload = this.pendingMessages.pop();
			this.send(payload);
		}
	}

	//
	onMessage(msg) {
		let data;
		try {
			data = JSON.parse(msg.data);
		}
		catch (e) {
			console.warn(`Malformed response: "${msg.data}"`);
			return ;
		}
		// Not Authenticated
		if (data.error && data.error.error && data.error.error+'' ==='13') {
			window.location = '/login?type=expired';
			return ;
		}

		if (data.msg === EventMessage.Result) {
			PubSub.publish(data.id+'', {result: data.result, error: data.error});
		}
		else if (data.msg === EventMessage.Connected) {
			this.connected = true;
			setTimeout(() => this.ping(), 20000);
			if (this.onToken) {
				this.loginToken();
			}
			else {
				this.onConnect();
			}
		}
		else if (data.msg === EventMessage.Changed || data.msg === EventMessage.Added) {
			if (data['collection'] === URL.CORE_GET_JOBS) {
				if (!isEmpty(data['fields']) && !isEmpty(data['fields']['arguments']) && !isEmpty(data['fields']['method'])) {
					if (data['fields']['method'] === URL.POOL_EXPORT
						|| data['fields']['method'] === URL.POOL_REPLACE
						|| data['fields']['method'] === URL.POOL_UPDATE
						|| data['fields']['method'] === URL.POOL_REMOVE ) {
						PubSub.publish(data['fields']['method']+ '-'+ data['fields']['arguments'][0], {result: data['fields']});
					}
					else if (data['fields']['method'] === URL.POOL_CREATE) {
						PubSub.publish(data['fields']['method']+ '-' + data['fields']['id'], {result: data['fields']});
						PubSub.publish(data['fields']['method'], {result: data['fields']});
					}
					else if (data['fields']['method'] === URL.FILE_ACL_SET) {
						PubSub.publish(data['fields']['method'], {result: data['fields']});
					}
					// 存储池校验 硬盘初始化
					else {
						PubSub.publish(
							data['fields']['method']+ '-'+
							data['fields']['arguments'][1]+'-'+
							data['fields']['arguments'][0], {result: data['fields']}
						);
					}
				}
			}
			else if (data['collection'] === URL.POOL_QUERY) {
				PubSub.publish(data['collection']+ '-'+ data['fields']['id'], {result: data['fields']});
			}
			else if (data['collection'] === URL.ZFS_POOL_SCAN) {
				if (data['fields']['scan']) {
					PubSub.publish(data['collection']+ '-'+ data['fields']['name'], {result: data['fields']['scan']});
				}
			}
		}
	}

	//
	onClose() {
		this.connected = false;
		setTimeout(() => this.connect(), 5000);
		if (!this.shuttingdown) {

		}
	}

	//
	call(id, url, params=null) {
		let payload = {id, msg: EventMessage.Method, method: url};
		if (params !== null) {
			payload = {id, msg: EventMessage.Method, method: url, params};
		}
		this.send(payload);
	}

	//
	send(payload) {
		if (this.socket.readyState === WebSocket.OPEN && !this.onToken) {
			this.socket.send(JSON.stringify(payload));
		} else {
			this.pendingMessages.push(payload);
		}
	}

	//
	ping() {
		if (this.connected) {
			this.socket.send(JSON.stringify({ msg: EventMessage.Ping, id: getUUID() }));
			setTimeout(() => this.ping(), 20000);
		}
	}

	//loginToken
	loginToken() {
		const id = getUUID();
		const payload = {id, msg: EventMessage.Method, method: URL.AUTH, params: [this.token]};
		this.socket.send(JSON.stringify(payload))
		PubSub.subscribe(id, (_, {result})=>{this.loginTokenCallback(result)})
	}

	// loginTokenCallback
	loginTokenCallback(callback) {
		this.onToken = false;
		this.token = null;
		if (callback) {
			this.onConnect();
			const uuid = getUUID();
			PubSub.subscribe(uuid, (_, {result})=>{
				let userInfo = Cache.getUserInfo();
				userInfo['token'] = result;
				Cache.saveUserInfo(userInfo);
			})
			this.call(uuid, URL.GET_TOKEN, [300]);

			// 开启主动推送功能
			this.send({
				id: getUUID(),
				name: '*',
				msg: EventMessage.Sub,
			});
		}
		else {
			window.location = '/login?type=expired'
		}
	}
}

export const WebSocketService = new Socket()
