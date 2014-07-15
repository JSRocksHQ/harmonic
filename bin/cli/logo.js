var localconfig = require('../config'),
	helpers = require('../helpers'),
	clc = helpers.cli_color(),
	logo = "\n" +
        "|_| _  _ _ _  _  _ . _ \n" +
        "| |(_|| | | |(_)| ||(_ \n" +
        "                 " + localconfig.version +"  \n";

module.exports = clc.message(logo);
