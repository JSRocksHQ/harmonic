import { normalize } from 'path';

export default class Theme {

	constructor(name, sitePath) {
		this.name = name;
		this.sitePath = sitePath;
		this.themePath = normalize(`${sitePath}/node_modules/${name}`);
	}
}