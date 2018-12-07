import logger from './logger';

const getComputedStyle = (prop, el = document.body) => {
  let result = null;
  if ('getComputedStyle' in window) {
    result = window.getComputedStyle(el, null);
  } else {
    result = document.defaultView.getComputedStyle(el, null);
  }
  return result !== null ? parseInt(result[prop], 10) : 0;
};

const getAllMeasures = dimension => [
  dimension.bodyOffset(),
  dimension.bodyScroll(),
  dimension.documentElementOffset(),
  dimension.documentElementScroll(),
];

const getHeight = {
  bodyOffset: () => document.body.offsetHeight + getComputedStyle('marginTop') + getComputedStyle('marginBottom'),

  bodyScroll: () => document.body.scrollHeight,

  documentElementOffset: () => document.documentElement.offsetHeight,

  documentElementScroll: () => document.documentElement.scrollHeight,

  max: () => Math.max(...getAllMeasures(getHeight)),

  min: () => Math.min(...getAllMeasures(getHeight)),
};

const getWidth = {
  bodyOffset: () => document.body.offsetWidth,

  bodyScroll: () => document.body.scrollWidth,

  documentElementOffset: () => document.documentElement.offsetWidth,

  documentElementScroll: () => document.documentElement.scrollWidth,

  scroll: () => Math.max(getWidth.bodyScroll(), getWidth.documentElementScroll()),

  max: () => Math.max(...getAllMeasures(getWidth)),

  min: () => Math.min(...getAllMeasures(getWidth)),
};

export const calculateHeight = (calMethod = 'bodyOffset') => {
  if (!(calMethod in getHeight)) {
    logger.error(`'${calMethod}' is not a valid method name!`);
  }
  return getHeight[calMethod]();
};

export const calculateWidth = (calMethod = 'scroll') => {
  if (!(calMethod in getWidth)) {
    logger.error(`'${calMethod}' is not a valid method name!`);
  }
  return getWidth[calMethod]();
};

/**
 * This function returns the offset height of the given node relative to the top of document.body
 */
export const getOffsetToBody = (node, offset = 0) => {
  // If the given node is body or null, return 0
  if (!node || node === window.document.body) {
    return 0;
  }

  // Stops if the offset parent node is body;
  // Otherwise keep searching up
  // NOTE: offsetParent will return null on Webkit if the element is hidden
  //       (the style.display of this element or any ancestor is "none") or
  //       if the style.position of the element itself is set to "fixed"
  //       See reference at https://developer.mozilla.org/en-US/docs/Web/API/HTMLelement/offsetParent#Compatibility
  const calculatedOffset = node.offsetTop + offset;
  const { offsetParent } = node;

  if (offsetParent === window.document.body) {
    return calculatedOffset;
  }

  return getOffsetToBody(offsetParent, calculatedOffset);
};

/**
 * This function returns the offset height of the given node relative to the top of document.body
 */
export const getOffsetHeightToBody = node => (node
  ? getOffsetToBody(node) + node.offsetHeight
  : 0
);
