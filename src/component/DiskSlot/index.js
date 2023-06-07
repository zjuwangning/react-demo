import React, {useEffect, useState, forwardRef, useImperativeHandle} from 'react';
import { Row, Col, Select, notification, Popover } from "antd";
import PubSub from "pubsub-js";
import { URL } from "../../server/enum";
import { getUUID, isEmpty, getVolume } from "../../utils/cmn";
import { WebSocketService } from "../../server";
import { esp } from './enum'
import Cache from "../../utils/Cache";
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


		// 获取槽位规格 后续可能改成型号 0:当前系统不支持的规格
		// 根据设备型号 渲染槽位图   0: 2u8  1: 2u12  2: 2u24  3: 4u36  4: 4u60
		const getType = () => {
			let userInfo = Cache.getUserInfo()
			if (userInfo && typeof userInfo['productType']==='number') {
				getList(userInfo['productType'])
			}
			else {
				notification.error({message: '未获取到设备类型，请联系管理员！'})
			}
		}

		// 获取硬盘列表
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

		// 将数据的enclosure-slots 转化为实际图中的位置
		const sortData = (list, type) => {
			let temp = [];
			// 先把槽位表的title填满
			for (let k in esp[type]['es_pos']) {
				temp[esp[type]['es_pos'][k]['index']] = {slotTitle: esp[type]['es_pos'][k]['title']}
			}
			for (let k in list) {
				if (list[k]['enclosure'] && list[k]['enclosure']['number'] && list[k]['enclosure']['slot'] && esp[type]['es_pos'][list[k]['enclosure']['number']+'_'+list[k]['enclosure']['slot']]) {
					list[k]['slotTitle'] = esp[type]['es_pos'][list[k]['enclosure']['number']+'_'+list[k]['enclosure']['slot']]['title']
					temp[esp[type]['es_pos'][list[k]['enclosure']['number']+'_'+list[k]['enclosure']['slot']]['index']] = list[k]
				}
			}
			// 硬盘槽位只有一个面板时 slots值为一个数字 表示槽位总数量; 包含多个面板时 slots的值为一个数组对象
			if (typeof esp[type]['slots'] === 'number') {
				generateBox(temp, type);
			}
			else if (typeof esp[type]['slots'] === 'object') {
				generateBoxes(temp, type);
			}
		}

		// 单面板渲染机壳图
		const generateBox = (list, type) => {
			let temp = [];
			for (let k in list) {
				if (isEmpty(list[k]) || isEmpty(list[k]['enclosure'])) {
					const content = (
						<div key={'content'+k}>
							<p>未检测到硬盘</p>
						</div>
					);
					temp.push((
						<Popover key={'Popover'+k} content={content} title={'空闲插槽'}>
							<div id={'disk-'+Number(k)} className={'disk-item disk-disabled-item '+esp[type]['className']['item']}>{list[k]['slotTitle']}</div>
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
						<Popover key={'Popover'+k} content={content} title={list[k]['pool']?'已用硬盘':'空闲硬盘'}>
							<div id={'disk-'+Number(k)} className={list[k]['pool']?'disk-item disk-used-item '+esp[type]['className']['item']:'disk-item disk-idle-item '+esp[type]['className']['item']}>{list[k]['slotTitle']}</div>
						</Popover>
					))
				}
			}
			temp = (<div className={esp[type]['className']['box']}><Row className={esp[type]['className']['row']} type={'flex'}>{temp}</Row></div>)
			setBox(temp)
		}

		// 多面板渲染机壳图
		const generateBoxes = (list, type) => {
			let temp = [], index=0, plate = [];
			// 按面板给list分组
			for (let k in esp[type]['slots']) {
				let arrTemp = [];
				arrTemp = list.slice(index,index+esp[type]['slots'][k])
				plate.push(arrTemp)
				index+=esp[type]['slots'][k]
			}
			for (let k in plate) {
				let plateTemp = []
				for (let m in plate[k]) {
					if (isEmpty(plate[k][m]) || isEmpty(plate[k][m]['enclosure'])) {
						const content = (
							<div key={'content'+k+m}>
								<p>未检测到硬盘</p>
							</div>
						);
						plateTemp.push((
							<Popover key={'Popover'+k+m} content={content} title={'空闲插槽'}>
								<div id={'disk-'+Number(k)} className={'disk-item disk-disabled-item '+esp[type]['className']['item']}>{plate[k][m]['slotTitle']}</div>
							</Popover>
						))
					}
					else {
						const content = (
							<div key={'content'+k+m}>
								<p>名称：{plate[k][m]['name']}</p>
								<p>介质类型：{plate[k][m]['type']}</p>
								<p>容量：{getVolume(plate[k][m]['size'], 2)}</p>
								{
									plate[k][m]['pool']?(
										<p>存储池：{plate[k][m]['pool']}</p>
									):''
								}
							</div>
						);
						plateTemp.push((
							<Popover key={'Popover'+k+m} content={content} title={plate[k][m]['pool']?'已用硬盘':'空闲硬盘'}>
								<div id={'disk-'+Number(k)} className={plate[k][m]['pool']?'disk-item disk-used-item '+esp[type]['className']['item']:'disk-item disk-idle-item '+esp[type]['className']['item']}>{plate[k][m]['slotTitle']}</div>
							</Popover>
						))
					}
				}
				temp.push((
					<Row key={'Popover'+k} type={'flex'} style={{marginTop: '20px'}}>
						<Col>{esp[type]['title'][k]}： </Col>
						<div className={esp[type]['className']['box'][k]}><Row className={esp[type]['className']['row'][k]} type={'flex'}>{plateTemp}</Row></div>
					</Row>
				))
			}
			setBox(temp)
		}


		return (
			<div>
				<div style={{width: '800px', marginTop: '20px'}}>{box}</div>
				<Row type={'flex'} align={'middle'} style={{marginTop: '20px', width: '600px'}}>
					<div className={'disk-used-legend'}/> <span style={{marginLeft: '5px', marginRight: '20px'}}>已用硬盘</span>
					<div className={'disk-idle-legend'}/> <span style={{marginLeft: '5px', marginRight: '20px'}}>空闲硬盘</span>
					<div className={'disk-disabled-legend'}/> <span style={{marginLeft: '5px'}}>未检测到硬盘</span>
				</Row>
				<Select
					style={{marginTop: '30px', width: '200px'}}
					options={[
						{label: "HA_2000A(2U_8)", value: 0},
						{label: "HA_2000A(2U_12)", value: 1},
						{label: "HA_2000A(2U_24)", value: 2},
						{label: "HA_2000A(4U_36)", value: 3},
						{label: "HA_2000A(4U_60)", value: 4}
					]}
					onChange={value => getList(value)}
				/>
			</div>
		);
	}
)

export default DisksSlot;
