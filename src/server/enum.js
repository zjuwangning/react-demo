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
	DATASET_SHARE: 'smarcoshare.query_all_share_status',    // 查询所有数据集共享情况

	/* 快照相关 */
	SNAPSHOT_QUERY: 'zfs.snapshot.query',       // 快照查询
	SNAPSHOT_CREATE: 'zfs.snapshot.create',     // 快照创建
	SNAPSHOT_DELETE: 'zfs.snapshot.delete',     // 快照删除
	SNAPSHOT_ROLLBACK: 'zfs.snapshot.rollback', // 快照回滚
	SNAPSHOT_CLONE: 'zfs.snapshot.clone',       // 快照导出/克隆

	/* 共享 */
	SHARE_QUERY: 'sharing.nfs.query',   // 共享信息获取
	SHARE_UPDATE: 'sharing.nfs.update', // 共享信息获取
	SHARE_PROTOCOL: 'service.query',    // 共享协议

	/* 文件权限 */
	FILE_ACL_QUERY: 'filesystem.getacl',      // 获取acl共享信息
	FILE_ACL_SET: 'filesystem.setacl',      // 获取acl共享信息
	FILE_STATE: 'filesystem.stat',      // 共享权限状态
	FILE_ACL_CHOICES: 'filesystem.default_acl_choices',      // 共享权限状态
	FILE_ACL_DEFAULT: 'filesystem.get_default_acl',      // 共享权限状态

	/* 任务相关 */
	JOBS_QUERY: 'core.get_jobs',        // 获取任务
	JOBS_ABORT: 'core.job_abort',       // 中止任务

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

	/* 内核相关 */
	CORE_GET_JOBS: 'core.get_jobs',     // 获取任务
	ZFS_POOL_SCAN: 'zfs.pool.scan',         // scan数据上报

	/* 服务相关 */
	SERVICE_QUERY: 'service.query',     // 服务状态查询

	/* 性能监控 */
	REPORT_GET: 'reporting.get_data',   // 获取性能监控数据
}


export { EventMessage, URL }
