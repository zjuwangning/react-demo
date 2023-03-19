const SubEvent = {
	SWITCH_PAGE: 'switch_page'
}

const BreadcrumbData = {
	'storage': {name: '存储池', isPage: false},
	'disks': {name: '物理硬盘', isPage: true},
	'initialization': {name: '初始化', isPage: true},
	'pools': {name: '存储池列表', isPage: true},
	'scrub': {name: '存储池校验', isPage: true},

	'share': {name: 'NAS共享', isPage: false},
	'files': {name: '共享文件', isPage: true},
	'protocol': {name: '共享协议', isPage: true},
	'snapshot-manage': {name: '快照管理', isPage: true},
	'snapshot-lists': {name: '定期快照', isPage: true},

	'credentials': {name: 'NAS账户', isPage: false},
	'users': {name: 'NAS用户', isPage: true},
	'groups': {name: 'NAS群组', isPage: true},

	'system': {name: '系统设置', isPage: false},
	'network': {name: '网络设置', isPage: true},
	'update': {name: '系统升级', isPage: true},

	'create': {name: '新建', isPage: true},
	'edit': {name: '编辑', isPage: true},
	'member': {name: '成员', isPage: true},
}

export { SubEvent, BreadcrumbData }
