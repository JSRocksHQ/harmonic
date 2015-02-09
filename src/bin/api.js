class Harmonic {

	constructor(path) {
		this.sitePath = path;
		console.log(`Project path: ${this.sitePath}`);
	}

	init() {
		return Promise.resolve('init...');
	}

	newPost() {
		return Promise.resolve('new post...');
	}

	build() {
		return Promise.resolve('build...');
	}

}

module.exports = Harmonic;