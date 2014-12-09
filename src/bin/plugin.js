import { getConfig } from './helpers';

let Plugin = function() {
    this.loadAll = function() {
        console.log('>>>>>>>>>>>>>>>>', getConfig('npm'));
    };
};

export default Plugin;
