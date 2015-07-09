import { normalize, join } from 'path';

// rootdir === `dist` dir
export const rootdir = normalize(join(__dirname, '/../'));
export { version } from '../../package.json';
export const postspath = normalize('./src/posts/');
export const pagespath = normalize('./src/pages/');
