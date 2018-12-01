import Frame from './frame';

/**
 * Add the given event handler to an EventEmitter instance
 * @param {EventEmitter} emitter - an instance of EventEmitter
 * @param {string} event - event name
 * @param {function} handler - event handler function
 */
const addEventHandler = (emitter, event, handler) => {
  if (typeof handler === 'function') {
    emitter.on(event, handler);
  }
};

const Consumer = {
  /**
   * Initialize a consumer.
   * @param  {Array}  globalHandlers - an object containing event handlers that apply to all frames.
   * @example
   * // Each key/value pair in globalHandlers should be a pair of event name and event handler.
   * const handlers = {'eventA': function() {}, 'eventB': function() {}};
   * Consumer.init(handlers);
   */
  init(globalHandlers = {}) {
    this.globalHandlers = globalHandlers;
  },

  /**
  * Mount the given source as an application into the given container.
  * @param {object} container - The DOM element to append the mounted frame to.
  * @param {string} source - The source URL to load the app from.
  * @param {string} options - An optional parameter that contains optional configs
  * @return {Frame} Returns the application that was mounted.
  */
  mount(container, source, options = {}) {
    const frame = new Frame();
    frame.init(container, source, options);

    // Apply global handlers to the frame
    Object.keys(this.globalHandlers).forEach((event) => {
      const handlers = this.globalHandlers[event];

      // If 'handlers' is an array, apply each handler to frame
      if (Array.isArray(handlers)) {
        handlers.forEach(handler => addEventHandler(frame, event, handler));
      } else {
        addEventHandler(frame, event, handlers);
      }
    });

    frame.mount();

    return frame;
  },

};

export default Consumer;
