/**
 * Check if an elements or any of its parents have a given class name
 * @param element
 * @param className
 * @returns boolean
 */
const parentHasClass = (element, className) => {
  if (element.classList && Array.from(element.classList).some((pClassName) => pClassName === className)) {
    return true;
  }
  return !!(element.parentNode && parentHasClass(element.parentNode, className));
};

export default parentHasClass;
