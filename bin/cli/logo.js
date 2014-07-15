var localconfig = require('../config');
var helpers = require('../helpers');
var clc = helpers.cli_color();

var logo = "\n" +
        "|_| _  _ _ _  _  _ . _ \n" +
        "| |(_|| | | |(_)| ||(_ \n" +
        "                 " + localconfig.version +"  \n";

module.exports = clc.message(logo);
