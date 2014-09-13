var localconfig = require('../config');

module.exports = {
	version : localconfig.version,
	getHello : function () {
		return "Hello from API";
	}
}