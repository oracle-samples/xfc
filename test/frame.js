import { expect } from 'chai';
import { EventEmitter } from 'events';
import JSONRPC from 'jsonrpc-dispatch';
import sinon from 'sinon';

import Frame from '../src/consumer/frame';


describe('Frame', () => {
  it('should be an instance of EventEmitter', () => {
    expect(new Frame()).to.be.an.instanceof(EventEmitter);
  });

  describe('#init() with secret', () => {
    const container = document.body;
    const source = "*";
    const options = { secret: 123 };
    const frame = new Frame();
    frame.init(container, source, options);

    it('sets the container', () => expect(frame.container).to.equal(container));
    it('sets the source', () => expect(frame.source).to.equal(source));
    it('sets the secret', () => expect(frame.secret).to.equal(options.secret));
    it('sets the JSONRPC', () => expect(frame.JSONRPC).to.be.an.instanceof(JSONRPC));
  });

  describe('#init() without secret', () => {
    const container = document.body;
    const source = 'http://test.com:8080/test';
    const frame = new Frame();
    frame.init(container, source);

    it('sets the container', () => expect(frame.container).to.equal(container));
    it('sets the source', () => expect(frame.source).to.equal(source));
    it('sets the secret to null', () => expect(frame.secret).to.be.null);
    it('sets the JSONRPC', () => expect(frame.JSONRPC).to.be.an.instanceof(JSONRPC));

    describe('#mount()', () => {
      const emit = sinon.stub();
      frame.on('xfc.mounted', () => emit());
      frame.mount();

      it("sets the wrapper's data-status to mounted", () => {
        expect(frame.wrapper.getAttribute('data-status')).to.equal('mounted');
      });
      it("sets the iframe's src to source", () => {
        expect(frame.iframe.src).to.equal(source);
      });
      it("emits 'xfc.mounted' event", () => {
        sinon.assert.called(emit);
      });
    });

    describe('#unmount()', () => {
      const emit = sinon.stub();
      frame.on('xfc.unmounted', () => emit());
      frame.unmount();

      it("removes the wrapper from container's child nodes", () => {
        expect(frame.wrapper.parentNode).to.not.equal(frame.container);
      });
      it("emits 'xfc.unmounted' event", () => {
        sinon.assert.called(emit);
      });
    });

    describe('#send(message)', () => {
      it("calls postMessage with given message on iframe.contentWindow", sinon.test(function() {
        const postMessage = this.stub(frame.iframe.contentWindow, "postMessage");
        const message = {data: 'test'};
        frame.send(message);

        sinon.assert.calledWith(postMessage, message);
      }));
    });

    describe('#trigger(event, detail)', () => {
      it("calls this.JSONRPC.notification of 'event' with event and detail", sinon.test(function() {
        const notification = this.stub(frame.JSONRPC, 'notification');
        const event = 'TestEvent';
        const detail = {data: 'test'};
        frame.trigger(event, detail);

        sinon.assert.calledWith(notification, 'event', [event, detail]);
      }));
    });

    describe('#handleProviderMessage(event)', () => {
      const handle = sinon.stub(frame.JSONRPC, 'handle');
      after(()=> handle.restore());

      it("ignores non-JSONRPC messages", () => {
        const event = {data: 'bad data'};
        frame.handleProviderMessage(event);

        sinon.assert.notCalled(handle);
      });

      it("ignores messages from different frame windows", () => {
        const event = {data: {jsonrpc: '2.0'}, source: null};
        frame.handleProviderMessage(event);

        sinon.assert.notCalled(handle);
      });

      it("ignores messages from different origins", () => {
        const event = {
          data: {jsonrpc: '2.0'},
          source: frame.iframe.contentWindow,
          origin: 'invalid_origin'
        };
        frame.handleProviderMessage(event);

        sinon.assert.notCalled(handle);
      });

      it("calls this.JSONRPC.handle with the data of given event", () => {
        const event = {
          data: {jsonrpc: '2.0'},
          source: frame.iframe.contentWindow,
          origin: frame.origin
        };
        frame.handleProviderMessage(event);

        sinon.assert.calledWith(handle, event.data);
      });
    });
  });
});
