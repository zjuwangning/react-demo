const SubEvent = {
	SWITCH_PAGE: 'switch_page'
}

const BreadcrumbData = {
	'storage': {name: '存储池', isPage: false},
	'disks': {name: '物理硬盘', isPage: true},
	'initialization': {name: '初始化', isPage: true},
	'pools': {name: '存储池列表', isPage: true},
	'scrub': {name: '存储池校验', isPage: true},

	'network': {name: '网络管理', isPage: true},
	'global-config': {name: '全局配置', isPage: true},
	'bond': {name: '网卡绑定', isPage: true},
	'config': {name: '网络配置', isPage: true},

	'share': {name: 'NAS共享', isPage: false},
	'files': {name: '共享文件', isPage: true},
	'protocol': {name: '共享协议', isPage: true},
	'snapshot-manage': {name: '快照管理', isPage: true},

	'smb-auth': {name: 'SMB授权', isPage: true},
	'nfs-auth': {name: 'NFS授权', isPage: true},
	'snapshot': {name: '快照', isPage: true},

	'task': {name: '任务管理', isPage: false},
	'snapshot-task': {name: '定期快照', isPage: true},
	'scrub-task': {name: '校验任务', isPage: true},
	'rsync-task': {name: '同步任务', isPage: true},
	'priority': {name: '优先级', isPage: true},

	'credentials': {name: 'NAS账户', isPage: false},
	'users': {name: 'NAS用户', isPage: true},
	'groups': {name: 'NAS群组', isPage: true},

	'system': {name: '系统设置', isPage: false},
	'logs': {name: '系统日志', isPage: true},
	'email': {name: '邮件预警', isPage: true},
	'service': {name: '服务设置', isPage: true},
	'update': {name: '系统升级', isPage: true},

	'details': {name: '查看详情', isPage: true},
	'create': {name: '新建', isPage: true},
	'edit': {name: '编辑', isPage: true},
	'member': {name: '成员', isPage: true},

	'smb': {name: 'SMB设置', isPage: true},
	'nfs': {name: 'NFS设置', isPage: true},
	'ftp': {name: 'FTP设置', isPage: true},
	'ssh': {name: 'SSH设置', isPage: true},
	'webdav': {name: 'WebDAV设置', isPage: true},
}

export { SubEvent, BreadcrumbData }
