// Add polyfill for hasAttribute

(function (prototype) {
  prototype.hasAttribute = prototype.hasAttribute || function (name) {
    return !!(this.attributes[name] &&
      this.attributes[name].specified);
  }
})(Element.prototype);
