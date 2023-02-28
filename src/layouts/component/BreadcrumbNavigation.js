import React from 'react';
import { Breadcrumb } from "antd";
import { useLocation } from "react-router-dom";
import PubSub from "pubsub-js";
import { SubEvent, BreadcrumbData } from "../enum";
import '../index.css'


const BreadcrumbNavigation = () => {
	const location = useLocation();

	const pathSnippets = location.pathname.split('/').filter((i) => i);
	const extraBreadcrumbItems = pathSnippets.map((item, index) => {
		const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
		if (item === 'dashboard') return
		else if (index+'' === pathSnippets.length-1+'') {
			return (
				<Breadcrumb.Item key={url}>
					{BreadcrumbData[item]['name']}
				</Breadcrumb.Item>
			)
		}
		else if (BreadcrumbData[item] && BreadcrumbData[item]['isPage']) {
			return (
				<Breadcrumb.Item key={url}>
					<a onClick={()=>{PubSub.publish(SubEvent.SWITCH_PAGE, url)}}>{BreadcrumbData[item]['name']}</a>
				</Breadcrumb.Item>
			);
		}
		else {
			return (
				<Breadcrumb.Item key={url}>
					{BreadcrumbData[item]['name']}
				</Breadcrumb.Item>
			)
		}
	});

	let breadcrumbItems = [
		<Breadcrumb.Item key="home">
			<a onClick={()=>{PubSub.publish(SubEvent.SWITCH_PAGE, '/dashboard')}}>首页</a>
		</Breadcrumb.Item>,
	].concat(extraBreadcrumbItems);

	if (pathSnippets[0] === 'dashboard') {
		breadcrumbItems = [
			<Breadcrumb.Item key="home">
				首页
			</Breadcrumb.Item>,
		]
	}


	return (
		<Breadcrumb>
			{breadcrumbItems}
		</Breadcrumb>
	);
};
export default BreadcrumbNavigation;
