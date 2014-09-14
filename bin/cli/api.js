var localconfig = require('../config'),
	EventEmitter = require("events").EventEmitter;

module.exports = new EventEmitter();
module.exports.version = localconfig.version;
module.exports.getHello = function () {
	module.exports.emit('start');
	return "Hello from API";
}