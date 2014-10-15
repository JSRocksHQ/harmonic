var localconfig = require('../config'),
	EventEmitter = require("events").EventEmitter,
	ee = new EventEmitter();
	
module.exports.events = ee;
module.exports.version = localconfig.version;
module.exports.getHello = function () {
	return "Hello from API";
}