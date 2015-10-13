import chai from 'chai';

chai.use(require('sinon-chai'));
chai.use(require('chai-datetime'));

global.expect = chai.expect;

global.sinon = require('sinon');
global._ = require('lodash');
global.Promise = require('bluebird');
