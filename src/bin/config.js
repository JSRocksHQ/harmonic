import { normalize, join } from 'path';

// rootdir === `dist` dir
export let rootdir = normalize(join(__dirname, '/../'));
export { version } from '../../package.json';
export let postspath = normalize('./src/posts/');
export let pagespath = normalize('./src/pages/');
