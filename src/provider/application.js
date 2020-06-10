import JSONRPC from 'jsonrpc-dispatch';
import { fixedTimeCompare } from '../lib/string';
import { EventEmitter } from 'events';
import URI from '../lib/uri';
import logger from '../lib/logger';
import { getOffsetHeightToBody, calculateHeight, calculateWidth } from '../lib/dimension';
import MutationObserver from 'mutation-observer';

/** Application class which represents an embedded application. */
class Application extends EventEmitter {
  /**
   * init method
   * @param  options.acls            An array that contains white listed origins
   * @param  options.secret          A string or function used for authorization with Consumer
   * @param  options.onReady         A function that will be called after App is authorized
   * @param  options.targetSelectors A DOMString containing one or more selectors to match against.
   *                                 This string must be a valid CSS selector string; if it's not,
   *                                 a SyntaxError exception is thrown.
   * @param  options.options         An optional object used for App to transmit details to frame
   *                                 after App is authorized.
   */
  init({ acls = [], secret = null, onReady = null, targetSelectors = '', options = {}, customMethods = {} }) {
    this.acls = [].concat(acls);
    this.secret = secret;
    this.options = options;
    this.onReady = onReady;
    this.targetSelectors = targetSelectors;
    this.resizeConfig = null;
    this.requestResize = this.requestResize.bind(this);
    this.handleConsumerMessage = this.handleConsumerMessage.bind(this);
    this.authorizeConsumer = this.authorizeConsumer.bind(this);
    this.verifyChallenge = this.verifyChallenge.bind(this);
    this.emitError = this.emitError.bind(this);
    this.unload = this.unload.bind(this);

    // Resize for slow loading images
    document.addEventListener('load', this.imageRequestResize.bind(this), true);

    const self = this;
    const event = (event, detail) => {
      self.emit(event, detail);
      return Promise.resolve();
    };

    const resize = (config = {}) => {
      self.resizeConfig = config;

      self.requestResize();

      // Registers a mutation observer for body
      const observer = new MutationObserver(
        (mutations) => self.requestResize()
      );
      observer.observe(
        document.body,
        { attributes: true, childList: true, characterData: true, subtree: true }
      );

      // Registers a listener to window.onresize
      // Optimizes the listener by debouncing (https://bencentra.com/code/2015/02/27/optimizing-window-resize.html#debouncing)
      const interval = 100; // Resize event will be considered complete if no follow-up events within `interval` ms.
      let resizeTimer = null;
      window.onresize = (event) => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => self.requestResize(), interval);
      };

      return Promise.resolve();
    };

    const obj = Object.assign({}, customMethods, { resize, event });

    this.JSONRPC = new JSONRPC(self.send.bind(self), obj);
  }

  /**
   * imageRequestResize function to call requestResize event for slow loading image
   * @param {object} event - event which triggered the listener
   */
  imageRequestResize(event) {
    const tgt = event.target;
    if (tgt.tagName === 'IMG' && !(tgt.hasAttribute('height') || tgt.hasAttribute('width'))) {
      this.requestResize();
    }
  }

  requestResize() {
    if (!this.resizeConfig) return;
    if (this.resizeConfig.customCal) {
      this.JSONRPC.notification('resize');
    } else if (this.resizeConfig.autoResizeWidth) {
      const width = calculateWidth(this.resizeConfig.WidthCalculationMethod);
      this.JSONRPC.notification('resize', [null, `${width}px`]);
    } else {
      let height = calculateHeight(this.resizeConfig.heightCalculationMethod);

      // If targetSelectors is specified from Provider or Consumer or both,
      // need to calculate the height based on specified target selectors
      if (this.targetSelectors || this.resizeConfig.targetSelectors) {
        // Combines target selectors from two sources
        const targetSelectors = [this.targetSelectors, this.resizeConfig.targetSelectors]
          .filter(val => val)
          .join(', ');

        const heights = [].slice.call(document.querySelectorAll(targetSelectors))
          .map(getOffsetHeightToBody);

        height = Math.max(...heights, height);
      }

      this.JSONRPC.notification('resize', [`${height}px`]);
    }
  }

  /**
  * Triggers an event in the parent application.
  * @param {string} event - The event name to trigger.
  * @param {object} detail - The data context to send with the event.
  */
  trigger(event, detail) {
    this.JSONRPC.notification('event', [event, detail]);
  }

  invoke(jsonRPCFunction, args) {
    return this.JSONRPC.request(jsonRPCFunction, args || []);
  }

  /**
  * Request to mount an application fullscreen.
  * @param {string} url - The url of the application to mount.
  */
  fullscreen(url) {
    this.trigger('xfc.fullscreen', url);
  }

  /**
   * Sends http errors to consumer.
   * @param  {object} error - an object containing error details
   */
  httpError(error = {}) {
    this.trigger('xfc.provider.httpError', error);
  }

  /**
   * Request to load a new page of given url
   * @param  {string} url - The url of the new page.
   */
  loadPage(url) {
    this.JSONRPC.notification('loadPage', [url]);
  }

  /**
  * Launches the provider app and begins the authorization sequence.
  */
  launch() {
    if (window.self !== window.top) {
      // 1: Setup listeners for all incoming communication and beforeunload
      window.addEventListener('message', this.handleConsumerMessage);
      window.addEventListener('beforeunload', this.unload);

      // 2: Begin launch and authorization sequence
      this.JSONRPC.notification('launch');

      // 2a. We have a specific origin to trust (excluding wildcard *),
      // wait for response to authorize.
      if (this.acls.some((x) => x !== '*')) {
        this.JSONRPC.request('authorizeConsumer', [])
          .then(this.authorizeConsumer)
          .catch(this.emitError);

      // 2b. We don't know who to trust, challenge parent for secret
      } else if (this.secret) {
        this.JSONRPC.request('challengeConsumer', [])
          .then(this.verifyChallenge)
          .catch(this.emitError);

      // 2c. acl is '*' and there is no secret, immediately authorize content
      } else {
        this.authorizeConsumer();
      }

    // If not embedded, immediately authorize content
    } else {
      this.authorizeConsumer();
    }
  }

  /**
  * Handles an incoming message event by processing the JSONRPC request
  * @param {object} event - The emitted message event.
  */
  handleConsumerMessage(event) {
    // Ignore Non-JSONRPC messages or messages not from the parent frame
    if (!event.data.jsonrpc || event.source !== window.parent) {
      return;
    }

    logger.log('<< provider', event.origin, event.data);
    // For Chrome, the origin property is in the event.originalEvent object
    const origin = event.origin || event.originalEvent.origin;
    if (!this.activeACL && this.acls.includes(origin)) {
      this.activeACL = origin;
    }

    if (this.acls.includes('*') || this.acls.includes(origin)) {
      this.JSONRPC.handle(event.data);
    }
  }

  /**
  * Send the given message to the frame parent.
  * @param {object} message - The message to send.
  */
  send(message) {
    // Dont' send messages if not embedded
    if (window.self === window.top) {
      return;
    }

    if (this.acls.length < 1) {
      logger.error('Message not sent, no acls provided.');
    }

    if (message) {
      logger.log('>> provider', this.acls, message);
      if (this.activeACL) {
        parent.postMessage(message, this.activeACL);
      } else {
        this.acls.forEach((uri) => parent.postMessage(message, uri));
      }
    }
  }

  /**
  * Verify the challange made to the parent frame.
  * @param {string} secretAttempt - The secret string to verify
  */
  verifyChallenge(secretAttempt) {
    const authorize = () => {
      this.acls = ['*'];
      this.authorizeConsumer();
    };

    if (typeof this.secret === 'string' && fixedTimeCompare(this.secret, secretAttempt)) {
      authorize();
    } else if (typeof this.secret === 'function') {
      return this.secret.call(this, secretAttempt).then(authorize);
    }
    return Promise.resolve();
  }

  /**
  * Authorize the parent frame by unhiding the container.
  */
  authorizeConsumer() {
    document.documentElement.removeAttribute('hidden');

    // Emit a ready event
    this.emit('xfc.ready');
    this.JSONRPC.notification('authorized', [{ url: window.location.href, options: this.options }]);

    // If there is an onReady callback, execute it
    if (typeof this.onReady === 'function') {
      this.onReady.call(this);
    }
  }

  /**
   * Emit the given error
   * @param  {object} error - an error object containing error code and error message
   */
  emitError(error) {
    this.emit('xfc.error', error);
  }

  unload() {
    // These patterns trigger unload events but don't actually unload the page
    const protocols = /^(tel|mailto|fax|sms|callto):/;
    const element = document.activeElement;

    if (!element || !(element.hasAttribute && element.hasAttribute('download') || protocols.test(element.href))) {
      this.JSONRPC.notification('unload');
      this.trigger('xfc.unload');
    }
  }
}

export default Application;
