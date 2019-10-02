// Add polyfill for hasAttribute
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/hasAttribute#Polyfill
/* eslint-disable */

(function (prototype) {
  console.log('From xfc. Adding has attribute polyfill...')
  prototype.hasAttribute = prototype.hasAttribute || function (name) {
    return !!(this.attributes[name] &&
      this.attributes[name].specified);
  }
})(Element.prototype);
