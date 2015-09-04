import chai from 'chai';
import sinon from 'sinon';

chai.use(require('sinon-chai'));
chai.use(require('chai-datetime'));

global.expect = chai.expect;
global.sinon = sinon;
