import React, { useEffect, useState } from 'react';
import { Row, Col, Modal, notification, Button, Checkbox, Select, Progress } from "antd";
import PubSub from "pubsub-js";
import moment from 'moment';
import { URL } from "../../../server/enum";
import { getUUID } from "../../../utils/cmn";
import { WebSocketService } from "../../../server";
import {useNavigate} from "react-router-dom";
import Cache from "../../../utils/Cache";

let systemSub = null,
	downloadSub = null,
	observeSub = null,
	poolSub = null;


function Update() {
	const navigate = useNavigate();

	const [next, setNext] = useState(true);
	const [open, setOpen] = useState(false);
	const [seed, setSeed] = useState(false);
	const [loading, setLoading] = useState(false);
	const [path, setPath] = useState('');
	const [system, setSystem] = useState({});
	const [options, setOptions] = useState([]);
	const [percent, setPercent] = useState(0);

	// componentDidMount componentWillUnmount
	useEffect(() => {
		if (WebSocketService) {
			getSystem();
			getOptions();
		}

		return () => {
			PubSub.unsubscribe(systemSub);
			PubSub.unsubscribe(downloadSub);
			PubSub.unsubscribe(observeSub);
			PubSub.unsubscribe(poolSub);
		}
	}, []);

	// 获取存储池数据 生成路径选项
	const getOptions = () => {
		let uuid = getUUID();
		poolSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				let temp= [{label: 'Memory device', value: ':temp:'}]
				for (let k in result) {
					temp.push({label: result[k]['path'], value: result[k]['path']})
				}
				setOptions(temp)
			}
		})
		WebSocketService.call(uuid, URL.POOL_QUERY);
	}

	// 获取系统信息 SYSTEM_INFO
	const getSystem = () => {
		let uuid = getUUID();
		systemSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				setSystem(result);
			}
		})
		WebSocketService.call(uuid, URL.SYSTEM_INFO);
	}

	// 获取快照列表 CORE_DOWNLOAD
	const getDownload = () => {
		let uuid = getUUID();
		let mimeType = ''
		let fileName = `${system['hostname']}-${moment().format('YYYYMMDDHHmmss')}.`;
		if (seed) {
			fileName += 'tar';
			mimeType = 'application/x-tar';
		}
		else {
			fileName += '.db';
			mimeType = 'application/x-sqlite3';
		}
		downloadSub = PubSub.subscribe(uuid, (_, {result, error})=>{
			if (error) {
				notification.error({message: '数据获取失败，请稍后重试'})
			}
			else {
				generateBlob(result[1], mimeType, fileName)
			}
		})
		WebSocketService.call(uuid, URL.CORE_DOWNLOAD, ['config.save', [{ secretseed: seed }], fileName]);
	}

	// 根据url生成Blob对象
	const generateBlob = (url, mimeType, fileName) => {
		let xhr = new XMLHttpRequest();
		xhr.open('post', url);
		xhr.responseType = 'blob';
		xhr.onload = function () {
			const blob = new Blob([xhr.response], { type: mimeType });
			onCancel();
			setNext(true)
			downloadBlob(blob, fileName)
		}
		xhr.onerror = function () {
			notification.error({message: '下载文件出错，请稍后再试'});
			onCancel();
		}
		xhr.send();
	}

	// 下载Blob对象
	const downloadBlob = (blob, fileName) => {
		const tag = document.createElement('a');
		document.body.appendChild(tag);
		tag.download = fileName;
		tag.href = window.URL.createObjectURL(blob);
		tag.onclick = () => {
			// revokeObjectURL needs a delay to work properly
			setTimeout(() => {
				window.URL.revokeObjectURL(tag.href);
			}, 1500);
		};

		tag.click();
		tag.remove();
	}

	// onCancel
	const onCancel = () => {
		setOpen(false)
		setSeed(false)
	}

	// 应用更新
	const onUpload = () => {
		// if (path==='') {
		// 	notification.warning({message: '尚未选择临时存储位置'});
		// 	return ;
		// }
		let fileDom = document.getElementById('files');
		if(fileDom.files[0] === undefined) {
			notification.warning({message: '尚未选择更新文件'});
			return ;
		}

		const next = () => {
			let userInfo = Cache.getUserInfo();
			let url = '/_upload?auth_token='+userInfo['token']
			let formData = new FormData();
			let param = {method: "update.file", params: [{}]}
			formData.append("data", JSON.stringify(param));
			formData.append("file", fileDom.files[0]);
			let xhr = new XMLHttpRequest();
			xhr.open('post', url);
			xhr.onload = function () {
				observeJob(JSON.parse(xhr.response)['job_id'])
			}
			xhr.onerror = function () {
				setLoading(false);
				notification.error({message: '上传文件出错，请稍后再试'});
			}
			setLoading(true);
			xhr.send(formData);
		}

		Modal.confirm({
			title: '确认操作',
			content: (<div>
				<Row>是否确认上传更新文件</Row>
				<Row>{fileDom.files[0]['name']}</Row>
				<Row>并进行更新？</Row>
			</div>),
			onOk: next
		})
	}

	// 监听上传文件事件
	const observeJob = jobId => {
		PubSub.unsubscribe(observeSub);
		observeSub = PubSub.subscribe(jobId, (_, {result})=>{
			if (result['state'] === "FAILED") {
				Modal.error({title: 'errors', content: result['error']})
				setPercent(0);
				setLoading(false);
			}
			else if (result['state'] === "SUCCESS") {
				Modal.confirm({
					title: '更新成功',
					content: '更新成功，是否重启以生效本次更新？',
					onOk: ()=>{navigate('/reboot')}
				})
				setLoading(false);
				setPercent(0);
			}
			else {
				setPercent(result['progress']['percent'])
			}
		})
	}

	// 返回上一步
	const previous = () => {
		setNext(false);
		setPercent(0);
		setPath('');
	}


	return (
		<div className={'full-page'}>
			<Row className={'title'}>系统升级</Row>
			<Row className={'sub-title'}>进行NAS软件系统的升级</Row>
			<Row className={'actions'}>
				{
					next?'':(<Button type={'primary'} onClick={()=>{setOpen(true)}}>安装升级文件</Button>)
				}
			</Row>
			{
				next?(
					<div style={{width: '700px'}}>
						<Row type={'flex'} align={'middle'}>
							<Col span={6}><Row type={'flex'} justify={'end'}>当前系统版本：</Row></Col>
							<Col span={18}>{system['version']}</Col>
						</Row>
						{/*<Row type={'flex'} align={'middle'} style={{marginTop: '3vh'}}>*/}
						{/*	<Col span={6}><Row type={'flex'} justify={'end'}>更新文件临时存储位置：</Row></Col>*/}
						{/*	<Col span={18}>*/}
						{/*		<Select style={{width: '300px'}} options={options} value={path} onChange={path=>{setPath(path)}}/>*/}
						{/*	</Col>*/}
						{/*</Row>*/}
						<Row type={'flex'} align={'middle'} style={{marginTop: '3vh'}}>
							<Col span={6}><Row type={'flex'} justify={'end'}>更新文件：</Row></Col>
							<Col span={18}>
								<input id={'files'} type="file" accept={'.tar,.update'}/>
							</Col>
						</Row>
						<Row type={'flex'} align={'middle'} style={{marginTop: '3vh'}}>
							<Col span={6}><Row type={'flex'} justify={'end'}>更新进度：</Row></Col>
							<Col span={18}>
								<Progress percent={percent} size="small" status="active" style={{width: '300px'}}/>
							</Col>
						</Row>
						<Row type={'flex'} align={'middle'} style={{marginTop: '3vh'}}>
							<Col span={6} />
							<Col span={18}>
								<Button type={'primary'} onClick={onUpload} loading={loading}>应用更新</Button>
								<Button style={{marginLeft: '20px'}} onClick={previous}>取消</Button>
							</Col>
						</Row>
					</div>
				):''
			}


			<Modal
				open={open}
				title={'在更新前保存此机器的配置设置？'}
				onCancel={onCancel}
				footer={(
					<Row type={'flex'} justify={'end'}>
						<Button type={'primary'} onClick={getDownload}>保存</Button>
						<Button onClick={()=>{setNext(true);onCancel();}}>不保存</Button>
						<Button onClick={onCancel}>关闭</Button>
					</Row>
				)}
			>
				<Row style={{marginTop: '1vh', marginBottom: '1vh'}}>警告： 这个配置文件包含系统密码和其他的敏感信息。</Row>
				<Checkbox checked={seed} onChange={e=>{setSeed(e.target.checked)}}>包括密码密钥种子</Checkbox>
				<Row style={{marginTop: '1vh'}}>包括密码种子在内，允许将此配置文件与新的引导设备一起使用。</Row>
				<Row>它还会解密此系统上使用的所有密码。请妥善保管配置文件并防止未经授权的访问！</Row>
			</Modal>
		</div>
	);
}

export default Update;
