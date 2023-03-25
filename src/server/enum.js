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

	/* 存储相关 */
	DISK_QUERY: 'disk.query',           // 获取物理硬盘列表
	DISK_UNUSED: 'disk.get_unused',     // 获取可用硬盘
	DISK_WIPE: 'disk.wipe',             // 获取物理硬盘列表
	DISK_LOCATE: 'enclosure.set_slot_status',   // 定位硬盘
	DISK_GET_LOCATE: 'enclosure.get_slot_identify_status',      // 获取硬盘定位信息
	DISK_GET_TIME: 'enclosure.get_slot_identify_remain_time',   // 获取硬盘定位剩余时间

	POOL_QUERY: 'pool.query',           // 获取数据池
	POOL_CREATE: 'pool.create',         // 创建数据池
	POOL_UPDATE: 'pool.update',         // 更新数据池
	POOL_SCRUB: 'pool.scrub',           // 校验数据池
	POOL_ATTACH: 'pool.attachments',    // 获取数据池附属数据
	POOL_EXPORT: 'pool.export',         // 导出删除数据池
	POOL_OFFLINE: 'pool.offline',       // 离线硬盘
	POOL_ONLINE: 'pool.online',         // 上线硬盘
	POOL_REPLACE: 'pool.replace',       // 替换硬盘

	DATASET_QUERY: 'pool.dataset.query',        // 获取数据集

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
	GROUP_EDIT: 'group.update',          // 修改群组
	GROUP_DELETE: 'group.delete',       // 删除群组
	GROUP_GID_QUERY: 'group.get_next_gid',  // 新建用户群组时 获取默认gid

	/* 内核相关 */
	CORE_GET_JOBS: 'core.get_jobs',     // 获取任务
	ZFS_POOL_SCAN: 'zfs.pool.scan',     // 获取任务

}


export { EventMessage, URL }
