let environment = {}

if (process.env.NODE_ENV === 'production') {
	environment = {
		host: window.location.hostname,
		port: window.location.port,
		protocol: window.location.protocol,

		remote: window.location.hostname+':'+window.location.port,
		origin: window.location.protocol + '//' + window.location.hostname + ':' + window.location.port,
		production: true,
	};
}
else if (process.env.NODE_ENV === 'development') {
	environment = {
		host: '192.17.1.216',
		port: '80',
		protocol: 'http:',

		remote: '192.17.1.187',
		origin: 'http://192.17.1.187',
		production: false,
	};
}

export default environment
