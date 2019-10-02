// Add polyfill for hasAttribute

function hasAttribute(prototype) {
  prototype.hasAttribute = prototype.hasAttribute || hasAttribute(name) {
    return !!(this.attributes[name] &&
      this.attributes[name].specified);
  };
}

export { hasAttribute };
