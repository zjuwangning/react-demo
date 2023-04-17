const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
	app.use(
		createProxyMiddleware('/_download',{
			target: "http://192.17.1.216",
			changeOrigin: true,
			pathRewrite: {"^/_download" : "http://192.17.1.216:6000/_download"},
		}),
		createProxyMiddleware('/_upload',{
			target: "http://192.17.1.216",
			changeOrigin: true,
			pathRewrite: {"^/_upload" : "http://192.17.1.216:6000/_upload"},
		}),
	);
};
