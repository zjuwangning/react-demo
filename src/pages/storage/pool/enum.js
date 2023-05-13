import {Tag} from "antd";
import React from "react";

export const PoolScanFunction = {
	Scrub: 'SCRUB',
	Resilver: 'RESILVER',
}

export const PoolScanState = {
	Scanning: 'SCANNING',
	Running: 'RUNNING',
	Finished: 'FINISHED',
}

export const PoolScrubAction = {
	Start: 'START',
	Stop: 'STOP',
	Pause: 'PAUSE',
}

// 状态渲染成标签样式
export const renderState = (t, r) => {
	let color='', text = '';
	if (t === 'ONLINE') {
		if (r['type'] === 'DISK') {
			text='在线';
			color='green';
		}
		else if (r['type'] === 'REPLACING') {
			text='替换中';
			color='orange';
		}
		else if (r['type'] === 'SPARE') {
			text='在线';
			color='green';
		}
	}
	else if (t === 'OFFLINE') {
		text = '离线';
		color='orange';
	}
	else if (t === 'UNAVAIL') {
		text = '不可用';
		color='red';
	}
	else if (t === 'DEGRADED') {
		text = '降级';
		color='red';
	}
	return (<Tag color={color}>{text}</Tag>)
}

// 渲染替换中的磁盘
export const renderDisk = (t, r) => {
	if (r['type'] === 'DISK') {
		return t?t:'N/A'
	}
	else if (r['type'] === 'REPLACING') {
		return r['children'][0]['disk']+'→'+r['children'][1]['disk']
	}
	else if (r['type'] === 'SPARE') {
		return '热备'
	}
}
