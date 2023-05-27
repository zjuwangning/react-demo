import React, {useEffect, useState, forwardRef, useImperativeHandle} from 'react';
import { Row, Col, notification, Popover } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../server/enum";
import { getUUID, isEmpty, getVolume } from "../../utils/cmn";
import { WebSocketService } from "../../server";
import './index.less'

let fetchSub = null, typeSub = null;

const DisksSlot = forwardRef(
	({}, ref) => {

		// 暴露给父节点的方法
		useImperativeHandle(ref, () => ({
			refresh: getType,
		}))

		const [box, setBox] = useState([])    // 显示机壳图

		// componentDidMount componentWillUnmount
		useEffect(() => {
			getType();

			return () => {
				PubSub.unsubscribe(fetchSub);   // 获取硬盘
				PubSub.unsubscribe(typeSub);    // 获取机箱类型
			}
		}, []);

		// 获取槽位规格 0:当前系统不支持的规格 1: 2*4  2: 3*4  3: 1*24   4: 6*4+3*4
		const getType = () => {
			let uuid = getUUID();
			typeSub = PubSub.subscribe(uuid, (_, {result, error})=>{
				if (error) {
					notification.error({message: '数据获取失败，请稍后重试'})
				}
				else {
					getList(Number(result+''))
					// getList(4)
				}
			})
			WebSocketService.call(uuid, URL.SLOT_TYPE);
		}

		// 获取硬盘列表 SLOT_TYPE
		const getList = type => {
			let uuid = getUUID();
			fetchSub = PubSub.subscribe(uuid, (_, {result, error})=>{
				if (error) {
					notification.error({message: '数据获取失败，请稍后重试'})
				}
				else {
					sortData(result, type);
				}
			})
			WebSocketService.call(uuid, URL.DISK_QUERY, [[], {extra: {pools: true}}]);
		}

		// 数据按槽位类型排序
		const sortData = (list, type) => {
			let temp = []
			if (type === 1) {
				temp = ['', '', '', '', '', '', '', '']
				for (let k in list) {
					if (list[k]['pool'] !== 'boot-pool' && list[k]['enclosure'] && list[k]['enclosure']['slot'] && list[k]['enclosure']['slot']<=8) {
						temp[Number(list[k]['enclosure']['slot'])-1] = list[k]
					}
				}
			}
			else if (type === 2) {      // 3*4
				temp = ['', '', '', '', '', '', '', '', '', '', '', '']
				for (let k in list) {
					if (list[k]['pool'] !== 'boot-pool' && list[k]['enclosure'] && list[k]['enclosure']['slot'] && list[k]['enclosure']['slot']<=12) {
						temp[Number(list[k]['enclosure']['slot'])-1] = list[k]
					}
				}
			}
			else if (type === 3) {      // 1*24
				temp = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
				for (let k in list) {
					if (list[k]['pool'] !== 'boot-pool' && list[k]['enclosure'] && list[k]['enclosure']['slot'] && list[k]['enclosure']['slot']<=24) {
						temp[Number(list[k]['enclosure']['slot'])-1] = list[k]
					}
				}
			}
			else if (type === 4) {
				temp = [
					['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
					['', '', '', '', '', '', '', '', '', '', '', '']
				]

				for (let k in list) {
					if (list[k]['pool'] !== 'boot-pool' && list[k]['enclosure'] && list[k]['enclosure']['slot']) {
						if (list[k]['enclosure']['slot']>=5 && list[k]['enclosure']['slot']<=28) {
							temp[0][Number(list[k]['enclosure']['slot'])-5] = list[k]
						}
						else if (list[k]['enclosure']['slot']<=4) {
							temp[1][Number(list[k]['enclosure']['slot'])-1] = list[k]
						}
						else if (list[k]['enclosure']['slot']>=29&&list[k]['enclosure']['slot']<=36) {
							temp[1][Number(list[k]['enclosure']['slot'])-25] = list[k]
						}
					}
				}
			}
			generateBox(temp, type);
		}

		// 渲染机壳图
		const generateBox = (list, type) => {
			let temp = []
			if (type === 1) {
				for (let k in list) {
					if (isEmpty(list[k])) {
						const content = (
							<div key={'content'+k}>
								<p>未检测到硬盘</p>
							</div>
						);
						temp.push((
							<Popover key={'Popover'+k} content={content} title={'空闲插槽'}>
								<Col span={6}><div id={'disk-'+Number(k)} className={'disk-item disk-disabled-item item-1'}>{Number(k)+1}</div></Col>
							</Popover>
						))
					}
					else {
						const content = (
							<div key={'content'+k}>
								<p>名称：{list[k]['name']}</p>
								<p>介质类型：{list[k]['type']}</p>
								<p>容量：{getVolume(list[k]['size'], 2)}</p>
								{
									list[k]['pool']?(
										<p>存储池：{list[k]['pool']}</p>
									):''
								}
							</div>
						);
						temp.push((
							<Col span={6}>
								<Popover key={'Popover'+k} content={content} title={list[k]['pool']?'已用硬盘':'空闲硬盘'}>
									<div id={'disk-'+Number(k)} className={list[k]['pool']?'disk-item disk-used-item item-1':'disk-item disk-idle-item item-1'}>{Number(k)+1}</div>
								</Popover>
							</Col>
						))
					}
				}
				temp = (<div className={'box-1'}><Row className={'box-1-row'} type={'flex'}>{temp}</Row></div>)
				setBox(temp)
			}
			else if (type === 2) {
				for (let k in list) {
					if (isEmpty(list[k])) {
						const content = (
							<div key={'content'+k}>
								<p>未检测到硬盘</p>
							</div>
						);
						temp.push((
							<Popover key={'Popover'+k} content={content} title={'空闲插槽'}>
								<Col span={6}><div id={'disk-'+Number(k)} className={'disk-item disk-disabled-item item-2'}>{Number(k)+1}</div></Col>
							</Popover>
						))
					}
					else {
						const content = (
							<div key={'content'+k}>
								<p>名称：{list[k]['name']}</p>
								<p>介质类型：{list[k]['type']}</p>
								<p>容量：{getVolume(list[k]['size'], 2)}</p>
								{
									list[k]['pool']?(
										<p>存储池：{list[k]['pool']}</p>
									):''
								}
							</div>
						);
						temp.push((
							<Col span={6}>
								<Popover key={'Popover'+k} content={content} title={list[k]['pool']?'已用硬盘':'空闲硬盘'}>
									<div id={'disk-'+Number(k)} className={list[k]['pool']?'disk-item disk-used-item item-2':'disk-item disk-idle-item item-2'}>{Number(k)+1}</div>
								</Popover>
							</Col>
						))
					}
				}
				temp = (<div className={'box-2'}><Row className={'box-2-row'} type={'flex'}>{temp}</Row></div>)
				setBox(temp)
			}
			else if (type === 3) {
				for (let k in list) {
					if (isEmpty(list[k])) {
						const content = (
							<div key={'content'+k}>
								<p>未检测到硬盘</p>
							</div>
						);
						temp.push((
							<Popover key={'Popover'+k} content={content} title={'空闲插槽'}>
								<Col span={1}><div id={'disk-'+Number(k)} className={'disk-item disk-disabled-item item-3'}>{Number(k)+1}</div></Col>
							</Popover>
						))
					}
					else {
						const content = (
							<div key={'content'+k}>
								<p>名称：{list[k]['name']}</p>
								<p>介质类型：{list[k]['type']}</p>
								<p>容量：{getVolume(list[k]['size'], 2)}</p>
								{
									list[k]['pool']?(
										<p>存储池：{list[k]['pool']}</p>
									):''
								}
							</div>
						);
						temp.push((
							<Col span={1}>
								<Popover key={'Popover'+k} content={content} title={list[k]['pool']?'已用硬盘':'空闲硬盘'}>
									<div id={'disk-'+Number(k)} className={list[k]['pool']?'disk-item disk-used-item item-3':'disk-item disk-idle-item item-3'}>{Number(k)+1}</div>
								</Popover>
							</Col>
						))
					}
				}
				temp = (<div className={'box-3'}><Row className={'box-3-row'} type={'flex'}>{temp}</Row></div>)
			}
			else if (type === 4) {
				for (let m in list) {
					let slotTemp = []
					for (let k in list[m]) {
						let content, title, className, text;
						if (isEmpty(list[m][k])) {
							content = (<div key={'content'+m+k}><p>未检测到硬盘</p></div>);
							title = '空闲插槽';
							className = 'disk-item disk-disabled-item item-4'
						}
						else {
							content = (
								<div key={'content'+m+k}>
									<p>名称：{list[m][k]['name']}</p>
									<p>介质类型：{list[m][k]['type']}</p>
									<p>容量：{getVolume(list[m][k]['size'], 2)}</p>
									{list[m][k]['pool']?(<p>存储池：{list[m][k]['pool']}</p>):''}
								</div>
							);
							title = list[m][k]['pool']?'已用硬盘':'空闲硬盘';
							className = list[m][k]['pool']?'disk-item disk-used-item item-4':'disk-item disk-idle-item item-4'
						}
						if (m+''==='0') {
							text = Number(k)+5
						}
						else {
							if (k<=3) text = Number(k)+1
							else text = Number(k)+25
						}

						slotTemp.push((
							<Popover key={'Popover'+m+k} content={content} title={title}>
								<Col span={6}><div id={'disk-'+m+'-'+Number(k)} className={className}>{text}</div></Col>
							</Popover>
						))
					}
					temp.push((
						<Row style={{marginTop: m+''==='0'?'1px':'20px'}}>
							{m+''==='0'?'前面板：':'后面板：'}
							<div className={'box-4-'+m}><Row className={'box-4-'+m+'-row'} type={'flex'}>{slotTemp}</Row></div>
						</Row>
					))
				}
				temp = (<div>{temp}</div>)
			}
			setBox(temp)
		}

		return (
			<div>
				<Row type={'flex'} style={{width: '800px', marginTop: '20px'}}>{box}</Row>
				<Row type={'flex'} align={'middle'} style={{marginTop: '20px', width: '600px'}}>
					<div className={'disk-used-legend'}/> <span style={{marginLeft: '5px', marginRight: '20px'}}>已用硬盘</span>
					<div className={'disk-idle-legend'}/> <span style={{marginLeft: '5px', marginRight: '20px'}}>空闲硬盘</span>
					<div className={'disk-disabled-legend'}/> <span style={{marginLeft: '5px'}}>未检测到硬盘</span>
				</Row>
			</div>
		);
	}
)

export default DisksSlot;
