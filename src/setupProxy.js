const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
	app.use(
		createProxyMiddleware('/_download',{
			// target: "http://192.17.1.216",
			target: "http://192.17.1.178",
			changeOrigin: true,
			// pathRewrite: {"^/_download" : "http://192.17.1.216:6000/_download"},
			pathRewrite: {"^/_download" : "http://192.17.1.178:6000/_download"},
		}),
		createProxyMiddleware('/_upload',{
			// target: "http://192.17.1.216",
			target: "http://192.17.1.178",
			changeOrigin: true,
			// pathRewrite: {"^/_upload" : "http://192.17.1.216:6000/_upload"},
			pathRewrite: {"^/_upload" : "http://192.17.1.178:6000/_upload"},
		}),
	);
};
