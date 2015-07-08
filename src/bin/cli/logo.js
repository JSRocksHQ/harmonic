import { version } from '../config';
import { cliColor } from '../helpers';

const clc = cliColor(),
	logo = clc.message('\n' +
        '|_| _  _ _ _  _  _ . _ \n' +
        '| |(_|| | | |(_)| ||(_ \n' +
        '                 ' + version + '  \n');

export default logo;
