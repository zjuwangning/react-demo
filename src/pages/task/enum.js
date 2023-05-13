import React from 'react';
import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

export const periodOptions = [
	{"label": "00:00", "value": 0}, {"label": "01:00", "value": 1}, {"label": "02:00", "value": 2}, {"label": "03:00", "value": 3},
	{"label": "04:00", "value": 4}, {"label": "05:00", "value": 5}, {"label": "06:00", "value": 6}, {"label": "07:00", "value": 7},
	{"label": "08:00", "value": 8}, {"label": "09:00", "value": 9}, {"label": "10:00", "value": 10}, {"label": "11:00", "value": 11},
	{"label": "12:00", "value": 12}, {"label": "13:00", "value": 13}, {"label": "14:00", "value": 14}, {"label": "15:00", "value": 15},
	{"label": "16:00", "value": 16}, {"label": "17:00", "value": 17}, {"label": "18:00", "value": 18}, {"label": "19:00", "value": 19},
	{"label": "20:00", "value": 20}, {"label": "21:00", "value": 21}, {"label": "22:00", "value": 22}, {"label": "23:00", "value": 23}
]

export const weekOptions = [
	{"label": "周一", "value": 1},{"label": "周二", "value": 2},{"label": "周三", "value": 3},{"label": "周四", "value": 4},
	{"label": "周五", "value": 5},{"label": "周六", "value": 6},{"label": "周日", "value": 7},
]

export const delKeyList = ['nextStyle', 'interval', 'timePicker', 'execution', 'weekPlan']

export const timeOptions = [
	{ label: '00:00:00', value: '00:00' },
	{ label: '00:15:00', value: '00:15' },
	{ label: '00:30:00', value: '00:30' },
	{ label: '00:45:00', value: '00:45' },
	{ label: '01:00:00', value: '01:00' },
	{ label: '01:15:00', value: '01:15' },
	{ label: '01:30:00', value: '01:30' },
	{ label: '01:45:00', value: '01:45' },
	{ label: '02:00:00', value: '02:00' },
	{ label: '02:15:00', value: '02:15' },
	{ label: '02:30:00', value: '02:30' },
	{ label: '02:45:00', value: '02:45' },
	{ label: '03:00:00', value: '03:00' },
	{ label: '03:15:00', value: '03:15' },
	{ label: '03:30:00', value: '03:30' },
	{ label: '03:45:00', value: '03:45' },
	{ label: '04:00:00', value: '04:00' },
	{ label: '04:15:00', value: '04:15' },
	{ label: '04:30:00', value: '04:30' },
	{ label: '04:45:00', value: '04:45' },
	{ label: '05:00:00', value: '05:00' },
	{ label: '05:15:00', value: '05:15' },
	{ label: '05:30:00', value: '05:30' },
	{ label: '05:45:00', value: '05:45' },
	{ label: '06:00:00', value: '06:00' },
	{ label: '06:15:00', value: '06:15' },
	{ label: '06:30:00', value: '06:30' },
	{ label: '06:45:00', value: '06:45' },
	{ label: '07:00:00', value: '07:00' },
	{ label: '07:15:00', value: '07:15' },
	{ label: '07:30:00', value: '07:30' },
	{ label: '07:45:00', value: '07:45' },
	{ label: '08:00:00', value: '08:00' },
	{ label: '08:15:00', value: '08:15' },
	{ label: '08:30:00', value: '08:30' },
	{ label: '08:45:00', value: '08:45' },
	{ label: '09:00:00', value: '09:00' },
	{ label: '09:15:00', value: '09:15' },
	{ label: '09:30:00', value: '09:30' },
	{ label: '09:45:00', value: '09:45' },
	{ label: '10:00:00', value: '10:00' },
	{ label: '10:15:00', value: '10:15' },
	{ label: '10:30:00', value: '10:30' },
	{ label: '10:45:00', value: '10:45' },
	{ label: '11:00:00', value: '11:00' },
	{ label: '11:15:00', value: '11:15' },
	{ label: '11:30:00', value: '11:30' },
	{ label: '11:45:00', value: '11:45' },
	{ label: '12:00:00', value: '12:00' },
	{ label: '12:15:00', value: '12:15' },
	{ label: '12:30:00', value: '12:30' },
	{ label: '12:45:00', value: '12:45' },
	{ label: '13:00:00', value: '13:00' },
	{ label: '13:15:00', value: '13:15' },
	{ label: '13:30:00', value: '13:30' },
	{ label: '13:45:00', value: '13:45' },
	{ label: '14:00:00', value: '14:00' },
	{ label: '14:15:00', value: '14:15' },
	{ label: '14:30:00', value: '14:30' },
	{ label: '14:45:00', value: '14:45' },
	{ label: '15:00:00', value: '15:00' },
	{ label: '15:15:00', value: '15:15' },
	{ label: '15:30:00', value: '15:30' },
	{ label: '15:45:00', value: '15:45' },
	{ label: '16:00:00', value: '16:00' },
	{ label: '16:15:00', value: '16:15' },
	{ label: '16:30:00', value: '16:30' },
	{ label: '16:45:00', value: '16:45' },
	{ label: '17:00:00', value: '17:00' },
	{ label: '17:15:00', value: '17:15' },
	{ label: '17:30:00', value: '17:30' },
	{ label: '17:45:00', value: '17:45' },
	{ label: '18:00:00', value: '18:00' },
	{ label: '18:15:00', value: '18:15' },
	{ label: '18:30:00', value: '18:30' },
	{ label: '18:45:00', value: '18:45' },
	{ label: '19:00:00', value: '19:00' },
	{ label: '19:15:00', value: '19:15' },
	{ label: '19:30:00', value: '19:30' },
	{ label: '19:45:00', value: '19:45' },
	{ label: '20:00:00', value: '20:00' },
	{ label: '20:15:00', value: '20:15' },
	{ label: '20:30:00', value: '20:30' },
	{ label: '20:45:00', value: '20:45' },
	{ label: '21:00:00', value: '21:00' },
	{ label: '21:15:00', value: '21:15' },
	{ label: '21:30:00', value: '21:30' },
	{ label: '21:45:00', value: '21:45' },
	{ label: '22:00:00', value: '22:00' },
	{ label: '22:15:00', value: '22:15' },
	{ label: '22:30:00', value: '22:30' },
	{ label: '22:45:00', value: '22:45' },
	{ label: '23:00:00', value: '23:00' },
	{ label: '23:15:00', value: '23:15' },
	{ label: '23:30:00', value: '23:30' },
	{ label: '23:45:00', value: '23:45' },
	{ label: '23:59:00', value: '23:59' },
];

export const syncOptions = [
	{
		label: (
			<span>
				时间
				<Tooltip title="保存文件的修改时间。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'times'
	},
	{
		label: (
			<span>
				压缩
				<Tooltip title="进行压缩以减小要传输的数据大小。建议用于慢速连接。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'compress'
	},
	{
		label: (
			<span>
				存档
				<Tooltip title="设置后，rsync递归运行，保留符号链接，权限，修改时间，组和特殊文件。 当以root身份运行时，所有者，设备文件和特殊文件也将保留。等效于将标志-rlptgoD传递给rsync。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'archive'
	},
	{
		label: (
			<span>
				删除
				<Tooltip title="删除目标目录中源目录不存在的文件。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'delete'
	},
	{
		label: (
			<span>
				静默
				<Tooltip title="禁止来自远程服务器的信息性消息。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'quiet'
	},
	{
		label: (
			<span>
				保留权限
				<Tooltip title="保留原始文件权限。当用户设置为 root 时，建议勾选此项。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'preserveperm'
	},
	{
		label: (
			<span>
				保留扩展
				<Tooltip title="扩展属性被保留，要求两个系统都必须支持。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'preserveattr'
	},
	{
		label: (
			<span>
				延迟更新
				<Tooltip title="将每个更新文件中的临时文件保存到保留目录中，直到传输结束时所有传输的文件重命名完成。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'delayupdates'
	},
	{
		label: (
			<span>
				递归
				<Tooltip title="包括指定目录的所有子目录。取消设置时，仅包括指定的目录。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'recursive'
	},
	{
		label: (
			<span>
				启用
				<Tooltip title="启用这个rsync任务。取消设置则禁用此rsync任务而不删除它。">
					<QuestionCircleOutlined style={{color: 'rgba(0, 0, 0, 0.45)', marginLeft: '4px'}}/>
				</Tooltip>
			</span>
		),
		value: 'enabled'
	},
]

export const syncKeyList = ['direction', 'mode', 'path', 'remotehost', 'remotemodule', 'user']

export const syncOtherKeyList = ['archive', 'compress', 'delayupdates', 'delete', 'preserveattr', 'preserveperm', 'quiet', 'times', 'recursive', 'enabled']
