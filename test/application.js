import chai from 'chai';
import { expect } from 'chai';
import { EventEmitter } from 'events';
import JSONRPC from 'jsonrpc-dispatch';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import Application from '../src/provider/application';
import signonTest from 'sinon-test'

sinon.test = signonTest(sinon);
chai.use(sinonChai);

describe('Application', () => {
  it('should be an instance of EventEmitter', () => {
    expect(new Application()).to.be.an.instanceof(EventEmitter);
  });

  describe('#init()', () => {
    const acls = ['http://localhost:8080', '*.domain.com'];
    const secret = '123';
    const onReady = () => {};
    const customMethods = { add(x, y) { return Promise.resolve(x + y); } };
    const application = new Application();

    const oldDocument = global.document;
    global.document = {
      referrer: 'http://localhost:8080',
      createElement: document.createElement.bind(document),
      addEventListener: () => console.log('mock addEventListener')
    };
    application.init({acls, secret, onReady, customMethods});
    global.document = oldDocument;

    it("sets application's acls to the given acls", () => {
      expect(application.acls).to.eql(acls);
    });

    it("sets application's secret to the given secret", () => {
      expect(application.secret).to.equal(secret);
    });

    it("sets application's onReady to the given onReady", () => {
      expect(application.onReady).to.equal(onReady);
    });

    it("sets application's JSONRPC", () => {
      expect(application.JSONRPC).to.be.an.instanceof(JSONRPC);
    });

    it("calls addEventListener", sinon.test(function() {
      sinon.spy(document, 'addEventListener');
      expect(document.addEventListener.calledOnce);
    }));

    it("registers methods and customMethods with JSONRPC", sinon.test(function() {
      expect(application.JSONRPC.methods).to.have.keys(['add', 'event', 'resize']);
    }));

    describe('#trigger(event, detail)', () => {
      it("calls this.JSONRPC.notification of 'event' with event and detail", sinon.test(function() {
        const notification = this.stub(application.JSONRPC, 'notification');
        const event = 'TestEvent';
        const detail = {data: 'test'};
        application.trigger(event, detail);

        sinon.assert.calledWith(notification, 'event', [event, detail]);
      }));
    });

    describe('#invoke(method, args)', () => {
      it("calls this.JSONRPC.request without args", sinon.test(function() {
        const request = this.stub(application.JSONRPC, 'request');
        application.invoke('TestFunc');

        sinon.assert.calledWith(request, 'TestFunc', []);
      }));
      it("calls this.JSONRPC.request with args", sinon.test(function() {
        const request = this.stub(application.JSONRPC, 'request');
        const jsonRPCFunction = 'TestFunc';
        const args = [ 'test' ];
        application.invoke(jsonRPCFunction, args);

        sinon.assert.calledWith(request, 'TestFunc', args);
      }));
      it('returns a promise', sinon.test(function() {
        const promise = application.invoke('foo', ['hi']);
        expect(promise).to.be.an('promise');
      }));
    });

    describe('#fullscreen(url)', () => {
      it("calls this.trigger with event 'xfc.fullscreen' and given url", sinon.test(function() {
        const trigger = this.stub(application, 'trigger');
        const url = 'test_url';
        application.fullscreen(url);

        sinon.assert.calledWith(trigger, 'xfc.fullscreen', url);
      }));
    });

    describe('#httpError(error)', () => {
      it("calls this.trigger with event 'xfc.provider.httpError' and given error", sinon.test(function() {
        const trigger = this.stub(application, 'trigger');
        const error = 'error';
        application.httpError(error);

        sinon.assert.calledWith(trigger, 'xfc.provider.httpError', error);
      }));
    });

    describe('#loadPage(url)', () => {
      it("calls this.JSONRPC.notification of 'loadPage' with given url", sinon.test(function() {
        const notification = this.stub(application.JSONRPC, 'notification');
        const url = 'test_url';
        application.loadPage(url);

        sinon.assert.calledWith(notification, 'loadPage', [url]);
      }));
    });

    describe('#handleConsumerMessage(event)', () => {
      const handle = sinon.stub(application.JSONRPC, 'handle');
      afterEach(() => handle.reset());
      after(()=> handle.restore());

      it("ignores non-JSONRPC messages", () => {
        const event = {data: 'bad data'};
        application.handleConsumerMessage(event);

        sinon.assert.notCalled(handle);
      });

      it("ignores messages not from parent frame windows", () => {
        const event = {data: {jsonrpc: '2.0'}, source: null};
        application.handleConsumerMessage(event);

        sinon.assert.notCalled(handle);
      });

      it("ignores messages from different origins", () => {
        const event = {
          data: {jsonrpc: '2.0'},
          source: window.parent,
          origin: 'invalid_origin'
        };
        application.handleConsumerMessage(event);

        sinon.assert.notCalled(handle);
      });

      it('handles acl messages with wildcards', () => {
        const event = {
          data: { jsonrpc: '2.0' },
          source: window.parent,
          origin: 'http://t3_St.d0-main.domain.com',
        };

        application.handleConsumerMessage(event);

        sinon.assert.calledWith(handle, event.data);
        expect(application.activeACL).to.equal(undefined);
      });

      it('ignores messages that do not match against the origin end', () => {
        const event = {
          data: { jsonrpc: '2.0' },
          source: window.parent,
          origin: 'http://test.domain.com.bad.com',
        };
        application.handleConsumerMessage(event);

        sinon.assert.notCalled(handle);
      });

      it('ignores messages when the origin is shorter than the wildcard acl', () => {
        const event = {
          data: { jsonrpc: '2.0' },
          source: window.parent,
          origin: '.com',
        };
        application.handleConsumerMessage(event);

        sinon.assert.notCalled(handle);
      });

      it("calls this.JSONRPC.handle with the data of given event", () => {
        const event = {
          data: {jsonrpc: '2.0'},
          source: window.parent,
          origin: acls[0]
        };
        application.handleConsumerMessage(event);

        sinon.assert.calledWith(handle, event.data);
      });

      it("sets an activeACL if origin is found within acls", () => {
        const event = {
          data: {jsonrpc: '2.0'},
          source: window.parent,
          origin: acls[0]
        };
        application.handleConsumerMessage(event);
        expect(application.activeACL).to.equal(acls[0]);
      });
    });

    describe('#verifyChallenge(secretAttempt)', () => {
      describe('this.secret is a string', () => {
        it("ignores it if secrets don't match", sinon.test(function() {
          const authorizeConsumer = this.stub(application, 'authorizeConsumer');
          application.verifyChallenge('12');

          sinon.assert.notCalled(authorizeConsumer);
        }));

        it("calls this.authorizeConsumer if secrets match", sinon.test(function() {
          const authorizeConsumer = this.stub(application, 'authorizeConsumer');
          application.verifyChallenge(secret);

          sinon.assert.called(authorizeConsumer);
        }));
      });

      describe('this.secret is a function', () => {
        const application = new Application();

        it("calls this.secret with secretAttempt", (done) => {
          const testSecret = '12'
          const secret = (secretAttempt) => {
            expect(secretAttempt).to.equal(testSecret);
            done();
            return Promise.resolve()
          };
          application.init({secret});

          application.verifyChallenge(testSecret);
        });

        it("calls this.authorizeConsumer eventually", (done) => {
          const secret = (secretAttempt) => Promise.resolve();
          application.init({secret});
          const authorizeConsumer = sinon.stub(
            application, 'authorizeConsumer').callsFake(() => {
              done();
              authorizeConsumer.restore();
            }
          );

          application.verifyChallenge("123");
        });

        it("handles failure from this.secret", sinon.test((done) => {
          const error = new Error('promise rejected');
          const secret = (secretAttempt) => Promise.reject(error);
          application.init({secret});
          application.verifyChallenge("123").catch((err) => {
            expect(err).to.equal(error);
            done();
          });
        }));
      });
    });

    describe("#authorizeConsumer()", () => {
      it("emits 'xfc.ready' event", () => {
        const emit = sinon.stub();
        application.on('xfc.ready', () => emit());
        application.authorizeConsumer();

        sinon.assert.called(emit);
      });

      it("calls this.JSONRPC.notification of 'authorized' with current url", sinon.test(function() {
        const notification = this.stub(application.JSONRPC, 'notification');
        application.authorizeConsumer();

        sinon.assert.calledWith(notification, 'authorized', [{ url: window.location.href, options: {} }]);
      }));

      it("calls this.JSONRPC.notification of 'authorized' with current url and generic options object", sinon.test(function() {
        const options = { moreDetail: 'detail' }
        const application = new Application();
        application.init({options});
        const notification = this.stub(application.JSONRPC, 'notification');
        application.authorizeConsumer();

        sinon.assert.calledWith(notification, 'authorized', [{ url: window.location.href, options: { moreDetail: 'detail'} }]);
      }));

      it("calls this.onReady if onReady is a function", () => {
        const onReady = sinon.stub();
        const application = new Application();
        application.init({onReady});
        application.authorizeConsumer();

        sinon.assert.called(onReady);
      });
    });

    describe("#emitError(error)", () => {
      it("emits 'xfc.error' with the given error", () => {
        let emittedError = null;
        const testErr = {code: 404, message: 'not found'};
        application.on('xfc.error', (err) => {
          emittedError = err;
        });
        application.emitError(testErr);

        expect(emittedError).to.equal(testErr);
      });
    });

    describe("#unload()", () => {
      let trigger;
      beforeEach(() => {
        trigger = sinon.stub(application, 'trigger');
      });
      afterEach(() => {
        application.trigger.restore();
      });

      it("calls this.trigger with event 'xfc.unload'", sinon.test(() => {
        application.unload();

        sinon.assert.calledWith(trigger, 'xfc.unload');
      }));
      it("does not call this.trigger with event 'xfc.unload'", sinon.test(() => {
        const newlink = document.createElement('a');
        newlink.setAttribute('href', 'tel:123');
        document.body.appendChild(newlink);
        newlink.focus();
        application.unload();
        sinon.assert.notCalled(trigger);

        sinon.assert.neverCalledWith(trigger, 'xfc.unload');
      }));
      it("calls this.trigger with event 'xfc.unload' for regular hrefs", sinon.test(() => {
        const newlink = document.createElement('a');
        newlink.setAttribute('href', 'https://www.google.com/');
        document.body.appendChild(newlink);
        newlink.focus();
        application.unload();

        sinon.assert.calledWith(trigger, 'xfc.unload');
      }));
    });
  });

  describe('#imageRequestResize(event)', () => {
    const application = new Application();
    it("calls requestResize for an image", sinon.test(function() {
      const requestResize = this.stub(application, 'requestResize');
      application.resizeConfig = {}
      const event = {
        target: {
          tagName: "IMG",
          hasAttribute: (attr) => { attr === 'height'}
        }
      };
      application.imageRequestResize(event);

      sinon.assert.called(requestResize);
    }));

    it("does not call requestResize for an image with height", sinon.test(function() {
      const requestResize = this.stub(application, 'requestResize');
      application.resizeConfig = {}

      let event = {
        target: {
          tagName: "IMG",
          hasAttribute: (attr) => { return ['width', 'height'].includes(attr)},
        }
      };
      application.imageRequestResize(event);

      sinon.assert.notCalled(requestResize);
    }));
  });

  describe('#requestResize()', () => {
    it("does not resize when resizeConfig is null", sinon.test(function() {
      const application = new Application();
      application.init({ acls: ['*']});
      const notification = this.stub(application.JSONRPC, 'notification');
      application.resizeConfig = null;
      application.requestResize();

      sinon.assert.notCalled(notification);
    }));
  });

  describe('#launch()', () => {
    describe('if window.self === window.top', () => {
      const tests = [
        { description: 'valid acls', args: { acls: ['http://localhost:8080'] } },
        { description: 'valid secret', args: { secret: '124' } },
        { description: 'acl = * and no secret', args: { acls: ['*'] } },
      ];

      tests.forEach((test) => {
        describe(test.description, () => {
          it('calls this.authorizeConsumer', () => {
            const application = new Application();
            application.init(test.args);
            const authorizeConsumer = sinon.stub(application, 'authorizeConsumer');
            application.launch();

            sinon.assert.called(authorizeConsumer);
          });
        });
      });
    });

    describe("if window.self !== window.top", () => {
      it("checks if eventListener is added'", sinon.test(function() {
        global.window = {
          addEventListener: () => console.log('mock addEventListener'),
          top: { length: -1 },
        };
        const oldDocument = global.document;
        global.document = {
          referrer: 'http://localhost:8080',
          createElement: document.createElement.bind(document),
          addEventListener: () => console.log('mock addEventListener'),
          body: (function () { return; })()
        };

        const application = new Application();
        sinon.spy(window, 'addEventListener');
        application.init({ acls: ['http://localhost:8080'] });
        global.document = oldDocument;

        application.launch();
        sinon.assert.callCount(window.addEventListener, 4);

        sinon.assert.calledWith(window.addEventListener, 'focus');
        sinon.assert.calledWith(window.addEventListener, 'blur');
        sinon.assert.calledWith(window.addEventListener, 'message');
        sinon.assert.calledWith(window.addEventListener, 'beforeunload');
      }));
    });
  });
});
