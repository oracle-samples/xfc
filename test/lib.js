import { expect } from 'chai';
import parentHasClass from '../src/lib/parentHasClass';


describe('lib', () => {
  describe('#parentHasClass', () => {
    it('returns true if element has class', () => {
      const element = document.createElement('div');
      element.classList.add('test-class');
      element.classList.add('another-class');
      expect(parentHasClass(element, 'test-class')).to.equal(true);
    });
    it('returns false if element des not have class', () => {
      const element = document.createElement('div');
      expect(parentHasClass(element, 'test')).to.equal(false);
    });

    it('returns true if parent of element has class', () => {
      const element = document.createElement('div');
      const parent = document.createElement('div');
      const grandParent = document.createElement('div');
      const greatGrandParent = document.createElement('div');
      element.classList.add('test-class');
      element.classList.add('another-class');
      parent.appendChild(element);
      grandParent.appendChild(parent);
      greatGrandParent.appendChild(grandParent);
      expect(parentHasClass(element, 'test-class')).to.equal(true);
    });
    it('returns false if parent of element does not have class', () => {
      const element = document.createElement('div');
      const parent = document.createElement('div');
      const grandParent = document.createElement('div');
      const greatGrandParent = document.createElement('div');
      parent.appendChild(element);
      grandParent.appendChild(parent);
      greatGrandParent.appendChild(grandParent);
      expect(parentHasClass(element, 'test')).to.equal(false);
    });
  });
});
