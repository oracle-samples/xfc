import { expect } from 'chai';
import { EventEmitter } from 'events';
import JSONRPC from 'jsonrpc-dispatch';
import sinon from 'sinon';

import Application from '../src/provider/application';

describe('Application', () => {
  it('should be an instance of EventEmitter', () => {
    expect(new Application()).to.be.an.instanceof(EventEmitter);
  });

  describe('#init()', () => {
    const acls = ['http://localhost:8080'];
    const secret = '123';
    const onReady = () => {};
    const application = new Application();

    const oldDocument = global.document;
    global.document = {referrer: 'http://localhost:8080', createElement: document.createElement.bind(document) };
    application.init({acls, secret, onReady});
    global.document = oldDocument;

    it ("sets activeACL to document referrer if in ACL", () => {
      expect(application.activeACL).to.eq(acls[0]);
    });

    it ("doesn't set activeACL to document referrer if not in ACL", () => {
      const insecureApp = new Application();
      global.document = {referrer: 'http://evilsite.com', createElement: document.createElement.bind(document) };
      insecureApp.init({acls, secret, onReady});
      global.document = oldDocument;

      expect(insecureApp.activeACL).to.equal(undefined);
    });

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

    describe('#trigger(event, detail)', () => {
      it("calls this.JSONRPC.notification of 'event' with event and detail", sinon.test(function() {
        const notification = this.stub(application.JSONRPC, 'notification');
        const event = 'TestEvent';
        const detail = {data: 'test'};
        application.trigger(event, detail);

        sinon.assert.calledWith(notification, 'event', [event, detail]);
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
            application, 'authorizeConsumer', () => {
              done();
              authorizeConsumer.restore();
            }
          );

          application.verifyChallenge("123");
        });
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

        sinon.assert.calledWith(notification, 'authorized', [{ url: window.location.href }]);
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

    // TODO: add tests for window.self !== window.top scenario.
    // Currently there's no tests for it because it's hard
    // to mock window object based on current source code.
    // See more at: http://stackoverflow.com/questions/11959746/sinon-stub-for-window-location-search#answer-11972168
  });
});
