import { expect } from 'chai';
import sinon from 'sinon';
import sinonTest from 'sinon-test';

import Application from '../src/provider/application';
import Provider from '../src/provider';

const test = sinonTest(sinon);


describe('Provider', () => {
  describe('#init(config)', () => {
    const acls = ['http://localhost:8080'];
    const secret = '123';
    const onReady = () => {};

    it('creates an instance of Application with given config', () => {
      Provider.init({ acls, secret, onReady });

      expect(Provider.application).to.be.an.instanceof(Application);
      expect(Provider.application.acls).to.eql(acls);
      expect(Provider.application.secret).to.equal(secret);
      expect(Provider.application.onReady).to.equal(onReady);
    });

    describe('#on(eventName, listener)', () => {
      it("calls 'on' method of this.application", test(function () {
        const eventName = 'eventA';
        const eventListener = () => {};
        const on = this.stub(Provider.application, 'on');
        Provider.on(eventName, eventListener);

        sinon.assert.calledWith(on, eventName, eventListener);
      }));
    });

    describe('#fullscreen(source)', () => {
      it("calls 'fullscreen' method of this.application", test(function () {
        const source = 'http://localhost:8080/page1.html';
        const fullscreen = this.stub(Provider.application, 'fullscreen');
        Provider.fullscreen(source);

        sinon.assert.calledWith(fullscreen, source);
      }));
    });

    describe('#httpError(error)', () => {
      it("calls 'httpError' method of this.application", test(function () {
        const error = 'error';
        const httpError = this.stub(Provider.application, 'httpError');
        Provider.httpError(error);

        sinon.assert.calledWith(httpError, error);
      }));
    });

    describe('#trigger(event, detail)', () => {
      it("calls 'trigger' method of this.application", test(function () {
        const event = 'eventA';
        const detail = { data: 'test' };
        const trigger = this.stub(Provider.application, 'trigger');
        Provider.trigger(event, detail);

        sinon.assert.calledWith(trigger, event, detail);
      }));
    });

    describe('#loadPage(url)', () => {
      it("calls 'loadPage' method of this.application", test(function () {
        const url = 'http://neworigin.com/page1';
        const loadPage = this.stub(Provider.application, 'loadPage');
        Provider.loadPage(url);

        sinon.assert.calledWith(loadPage, url);
      }));
    });
  });
});
