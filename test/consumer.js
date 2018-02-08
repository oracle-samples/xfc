import { expect } from 'chai';
import sinon from 'sinon';

import Consumer from '../src/consumer';
import Frame from '../src/consumer/frame';


describe('Consumer', () => {
  describe('#init(globalHandlers)', () => {
    it('sets this.globalHandlers to the given globalHandlers', () => {
      const globalHandlers = {'eventA': ()=>{}};
      Consumer.init(globalHandlers);

      expect(Consumer.globalHandlers).to.equal(globalHandlers);
    });

    it('sets this.globalHandlers to empty object if no argument', () => {
      Consumer.init();

      expect(Consumer.globalHandlers).to.be.empty;
    });
  });

  describe('#mount(container, source, options)', () => {
    const container = document.body;
    const iframeAttrs = { allow: 'camera; geolocation' };
    const source = 'http://test.com:8080/test';
    const options = { secret: 123, iframeAttrs };

    it('returns a mounted frame with given container and source', () => {
      const frame = Consumer.mount(container, source);

      expect(frame).to.be.an.instanceof(Frame);
      expect(frame.container).to.equal(container);
      expect(frame.source).to.equal(source);
      expect(frame.wrapper.getAttribute('data-status')).to.equal('mounted');
    });

    it('returns a frame with given secret if provided', () => {
      const frame = Consumer.mount(container, '*', options);

      expect(frame.secret).to.equal(options.secret);
    });

    it('returns a frame whose iframe has given custom attributes if provided', () => {
      const frame = Consumer.mount(container, '*', options);

      Object.entries(iframeAttrs).forEach(([key, value]) => {
        expect(frame.iframe.getAttribute(key)).to.equal(value);
      });
    });
  });

});
