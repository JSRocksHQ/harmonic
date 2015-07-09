import { version } from '../config';
import { cliColor } from '../helpers';

const clc = cliColor();
const logo = clc.message(`
|_| _  _ _ _  _  _ . _
| |(_|| | | |(_)| ||(_
                 ${version}
`);

export default logo;
