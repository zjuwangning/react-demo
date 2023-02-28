import PubSub from 'pubsub-js'
import environment from './environment'
import { EventMessage } from './enum'
import { getUUID } from '../utils/cmn'


export default class WebSocketService {
	constructor() {
		this.protocol = window.location.protocol;
		this.remote = environment.remote;
		this.pendingMessages = [];
		this.shuttingdown = false;      // 准备关闭socket 后续会用到
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
		this.send({ msg: EventMessage.Connect, version: '1', support: ['1'] });
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
			return;
		}

		if (data.msg === EventMessage.Result) {
			PubSub.publish(data.id, data.result);
		}
		else if (data.msg === EventMessage.Connected) {
			this.connected = true;
			setTimeout(() => this.ping(), 20000);
			this.onConnect();
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
	call(id, url, params) {
		const payload = {
			id, msg: EventMessage.Method, method: url, params,
		};
		this.send(payload);
	}

	//
	send(payload) {
		if (this.socket.readyState === WebSocket.OPEN) {
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
}
