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
	POOL_QUERY: 'pool.query',           // 获取数据池
	POOL_SCRUB: 'pool.scrub',           // 获取数据池
	DATASET_QUERY: 'pool.dataset.query',    // 获取数据集

	/* 任务相关 */
	JOBS_QUERY: 'core.get_jobs',        // 获取任务

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


}


export { EventMessage, URL }
