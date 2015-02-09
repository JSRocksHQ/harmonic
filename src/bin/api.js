import { init, config, newFile, run } from './cli/util';

class Harmonic {

	constructor(path) {
		this.sitePath = path;
		console.log(`Project path: ${this.sitePath}`);
	}

	init(settings) {
		return new Promise((resolve, reject) =>{
			init(this.sitePath, settings)
			.then(function(msg) {
				return Promise.resolve(msg);
			}, function(e) {
				console.log(e);
			});
		});
	}

	newPost() {
		return Promise.resolve('new post...');
	}

	build() {
		return Promise.resolve('build...');
	}

}

module.exports = Harmonic;