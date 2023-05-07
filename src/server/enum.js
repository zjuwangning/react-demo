const EventMessage = {
	Changed: 'changed',
	Added: 'added',
	Removed: 'removed',
	Result: 'result',
	Connected: 'connected',
	Connect: 'connect',
	NoSub: 'nosub',
	UnSub: 'unsub',
	Pong: 'pong',
	Sub: 'sub',
	Ping: 'ping',
	Method: 'method',
}

const URL = {
	/* 用户登录 */
	LOGIN: 'auth.login',                // 登录
	AUTH: 'auth.token',                 // 通过已有token鉴权
	GET_TOKEN: 'auth.generate_token',   // 获取token

	/* dashboard */
	SYS_INFO: 'system.info',        // 获取系统信息

	/* 硬盘 */
	DISK_QUERY: 'disk.query',           // 获取物理硬盘列表
	DISK_UNUSED: 'disk.get_unused',     // 获取可用硬盘
	DISK_WIPE: 'disk.wipe',             // 获取物理硬盘列表
	DISK_LOCATE: 'enclosure.set_slot_status',   // 定位硬盘
	DISK_GET_LOCATE: 'enclosure.get_slot_identify_status',      // 获取硬盘定位信息
	DISK_GET_TIME: 'enclosure.get_slot_identify_remain_time',   // 获取硬盘定位剩余时间

	/* 存储池 */
	POOL_QUERY: 'pool.query',           // 获取数据池
	POOL_CREATE: 'pool.create',         // 创建数据池
	POOL_UPDATE: 'pool.update',         // 更新数据池
	POOL_SCRUB: 'pool.scrub',           // 校验数据池
	POOL_ATTACH: 'pool.attachments',    // 获取数据池附属数据
	POOL_EXPORT: 'pool.export',         // 导出删除数据池
	POOL_OFFLINE: 'pool.offline',       // 离线硬盘
	POOL_ONLINE: 'pool.online',         // 上线硬盘
	POOL_REPLACE: 'pool.replace',       // 替换硬盘
	POOL_REMOVE: 'pool.remove',         // 删除硬盘

	/* 数据集 */
	DATASET_QUERY: 'pool.dataset.query',        // 获取数据集
	DATASET_CREATE: 'pool.dataset.create',      // 创建数据集
	DATASET_DELETE: 'pool.dataset.delete',      // 删除数据集
	DATASET_UPDATE: 'pool.dataset.update',      // 删除数据集
	DATASET_SHARE_ITEM: 'smarcoshare.query_share_status',   // 查询单个数据集共享情况
	DATASET_SHARE_MULTI: 'smarcoshare.query_multi_share_status',   // 查询多个数据集共享情况
	DATASET_SHARE: 'smarcoshare.query_all_share_status',    // 查询所有数据集共享情况

	/* 快照相关 */
	SNAPSHOT_QUERY: 'zfs.snapshot.query',       // 快照查询
	SNAPSHOT_CREATE: 'zfs.snapshot.create',     // 快照创建
	SNAPSHOT_DELETE: 'zfs.snapshot.delete',     // 快照删除
	SNAPSHOT_ROLLBACK: 'zfs.snapshot.rollback', // 快照回滚
	SNAPSHOT_CLONE: 'zfs.snapshot.clone',       // 快照导出/克隆

	/* 任务管理 */
	SNAP_TASK_QUERY: 'pool.snapshottask.query',     // 快照任务查询
	SNAP_TASK_CREATE: 'pool.snapshottask.create',   // 快照任务创建
	SNAP_TASK_UPDATE: 'pool.snapshottask.update',   // 快照任务编辑
	SNAP_TASK_DELETE: 'pool.snapshottask.delete',   // 快照任务删除
	SCRUB_TASK_QUERY: 'pool.scrub.query',           // 校验任务查询
	SCRUB_TASK_CREATE: 'pool.scrub.create',         // 校验任务创建
	SCRUB_TASK_UPDATE: 'pool.scrub.update',         // 校验任务编辑
	SCRUB_TASK_DELETE: 'pool.scrub.delete',         // 校验任务删除

	/* 共享 */
	SHARE_NFS_QUERY: 'sharing.nfs.query',       // NFS共享信息获取
	SHARE_NFS_UPDATE: 'sharing.nfs.update',     // NFS共享信息更新
	SHARE_SMB_QUERY: 'sharing.smb.query',       // smb共享信息获取
	SHARE_DAV_QUERY: 'sharing.webdav.query',    // webdav共享信息获取
	SHARE_DAV_CREATE: 'sharing.webdav.create',  // webdav共享信息新建
	SHARE_DAV_EDIT: 'sharing.webdav.update',    // webdav共享信息编辑
	SHARE_DAV_DELETE: 'sharing.webdav.delete',  // webdav共享信息删除
	SHARE_FTP_CREATE: 'sharing.ftp.create',     // 创建ftp共享数据
	SHARE_FTP_QUERY: 'sharing.ftp.query',       // 查询ftp共享数据
	SHARE_FTP_DELETE: 'sharing.ftp.delete',     // 删除ftp共享数据
	SHARE_FTP_UPDATE: 'sharing.ftp.update',     // 修改ftp共享数据

	/* 服务相关 */
	SERVICE_QUERY: 'service.query',     // 共享服务状态查询
	SERVICE_START: 'service.start',     // 共享服务开启
	SERVICE_STOP: 'service.stop',       // 共享服务关闭
	SMB_CONFIG: 'smb.config',           // 获取smb全局配置
	SMB_UPDATE: 'smb.update',           // 更新smb全局配置
	FTP_CONFIG: 'ftp.config',           // 获取ftp全局配置
	FTP_UPDATE: 'ftp.update',           // 更新ftp全局配置
	NFS_CONFIG: 'nfs.config',           // 获取nfs全局配置
	NFS_UPDATE: 'nfs.update',           // 更新nfs全局配置
	DAV_CONFIG: 'webdav.config',        // 获取dav全局配置
	DAV_UPDATE: 'webdav.update',        // 更新dav全局配置

	/* 文件权限 */
	FILE_ACL_QUERY: 'filesystem.getacl',      // 获取acl共享信息
	FILE_ACL_SET: 'filesystem.setacl',      // 获取acl共享信息
	FILE_STATE: 'filesystem.stat',      // 共享权限状态
	FILE_ACL_CHOICES: 'filesystem.default_acl_choices',      // 共享权限状态
	FILE_ACL_DEFAULT: 'filesystem.get_default_acl',      // 共享权限状态

	/* 任务相关 */
	JOBS_QUERY: 'core.get_jobs',        // 获取任务
	JOBS_ABORT: 'core.job_abort',       // 中止任务
	UPDATE_FILE: 'update.file',         // 手动更新

	/* 用户相关 */
	USER_QUERY: 'user.query',           // 获取用户
	USER_CREATE: 'user.create',         // 新建用户
	USER_EDIT: 'user.update',           // 修改用户
	USER_DELETE: 'user.delete',         // 删除用户
	USER_UID_QUERY: 'user.get_next_uid',    // 新建用户时 获取默认uid

	/* 用户组相关 */
	GROUP_QUERY: 'group.query',         // 获取群组
	GROUP_CREATE: 'group.create',       // 新建群组
	GROUP_EDIT: 'group.update',         // 修改群组
	GROUP_DELETE: 'group.delete',       // 删除群组
	GROUP_GID_QUERY: 'group.get_next_gid',  // 新建用户群组时 获取默认gid

	/* 网络相关 */
	NETWORK_QUERY: 'interface.query',       // 网卡接口获取
	NETWORK_CREATE: 'interface.create',     // 网卡接口创建(聚合)
	NETWORK_UPDATE: 'interface.update',     // 网卡接口数据更新
	NETWORK_PENDING: 'interface.has_pending_changes',       // 查询是否有需要测试的修改
	NETWORK_WAITING: 'interface.checkin_waiting',       // 查询是否等待的数据
	NETWORK_ROLLBACK: 'interface.rollback', // 还原更改
	NETWORK_TEST: 'interface.commit',       // 测试更改
	NETWORK_SAVE: 'interface.checkin',       // 保存更改

	NETWORK_GLOBAL_CONFIG: 'network.configuration.config',  // 获取全局配置
	NETWORK_GLOBAL_UPDATE: 'network.configuration.update',  // 更新全局配置

	/* 内核相关 */
	CORE_GET_JOBS: 'core.get_jobs',     // 获取任务
	CORE_DOWNLOAD: 'core.download',     // 获取下载
	ZFS_POOL_SCAN: 'zfs.pool.scan',         // scan数据上报

	/* 系统相关 */
	SYSTEM_INFO: 'system.info',         // 系统信息
	SYSTEM_REBOOT: 'system.reboot',     // 系统重启

	/* 报警相关 */
	LOGS_QUERY: 'alert.list',   // 报警列表
	MAIL_CONFIG: 'mail.config', // 获取配置
	MAIL_SEND: 'mail.send',     // 发送测试邮件
	MAIL_UPDATE: 'mail.update', // 邮件功能保存
	ALERT_QUERY: 'alertservice.query',      // 查询邮件预警
	ALERT_CREATE: 'alertservice.create',    // 创建邮件预警
	ALERT_UPDATE: 'alertservice.update',    // 修改邮件预警
	ALERT_DELETE: 'alertservice.delete',    // 删除邮件预警
	ALERT_TEST: 'alertservice.test',        // 测试邮件预警

	/* 性能监控 */
	REPORT_GET: 'reporting.get_data',   // 获取性能监控数据
}


export { EventMessage, URL }
