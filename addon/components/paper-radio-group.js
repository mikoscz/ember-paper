/**
 * @module ember-paper
 */
import { inject as service } from '@ember/service';

import { filterBy, mapBy, notEmpty } from '@ember/object/computed';
import Component from '@ember/component';
import { assert } from '@ember/debug';
import layout from '../templates/components/paper-radio-group';
import FocusableMixin from 'ember-paper/mixins/focusable-mixin';
import { ParentMixin } from 'ember-composability-tools';
import { isPresent } from '@ember/utils';
import { invokeAction } from 'ember-invoke-action';
import { computed } from '@ember/object';

/**
 * @class PaperRadioGroup
 * @extends Ember.Component
 * @uses FocusableMixin
 * @uses ParentMixin
 */
export default Component.extend(FocusableMixin, ParentMixin, {
  layout,
  tagName: 'md-radio-group',
  tabindex: 0,

  /* FocusableMixin Overrides */
  focusOnlyOnKey: true,

  radioComponent: 'paper-radio',

  constants: service(),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    assert('{{paper-radio-group}} requires an `onChange` action or null for no action', this.get('onChange') !== undefined);
  },

  didInsertElement() {
    this._super(...arguments);

    let labelNode = this.element.querySelector(`#${this.get('labelId')}`);
    this.set('labelNode', labelNode);
  },

  attributeBindings: ['ariaLabelledby:aria-labelledby'],

  enabledChildRadios: filterBy('childComponents', 'disabled', false),
  childValues: mapBy('enabledChildRadios', 'value'),
  hasLabel: notEmpty('labelNode'),

  ariaLabelledby: computed('hasLabel', 'labelId', function() {
    return this.get('hasLabel') ? this.get('labelId') : false;
  }),

  labelId: computed('elementId', function() {
    return `${this.elementId}-label`;
  }),

  keyDown(ev) {

    switch (ev.which) {
      case this.get('constants.KEYCODE.LEFT_ARROW'):
      case this.get('constants.KEYCODE.UP_ARROW'):
        ev.preventDefault();
        this.select(-1);
        break;
      case this.get('constants.KEYCODE.RIGHT_ARROW'):
      case this.get('constants.KEYCODE.DOWN_ARROW'):
        ev.preventDefault();
        this.select(1);
        break;
    }
  },

  select(increment) {
    let groupValue = this.get('groupValue');
    let index = 0;

    if (isPresent(groupValue)) {
      index = this.get('childValues').indexOf(groupValue);
      index += increment;
      let length = this.get('childValues.length');
      index = ((index % length) + length) % length;
    }

    let childRadio = this.get('enabledChildRadios').objectAt(index);
    childRadio.set('focused', true);
    invokeAction(this, 'onChange', childRadio.get('value'));
  },

  actions: {
    onChange(value) {
      invokeAction(this, 'onChange', value);
    }
  }
});
