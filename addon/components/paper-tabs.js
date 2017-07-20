import Ember from 'ember';
import layout from '../templates/components/paper-tabs';
import { ParentMixin } from 'ember-composability-tools';
import ColorMixin from 'ember-paper/mixins/color-mixin';

const { computed, Component, String: { htmlSafe } } = Ember;

export default Component.extend(ParentMixin, ColorMixin, {
  layout,
  tagName: 'md-tabs',

  classNames: ['md-no-tab-content'],
  attributeBindings: ['borderBottom:md-border-bottom'],

  selected: null, // key of item

  _selectedTab: computed('childComponents.@each.name', 'selected', function() {
    return this.get('childComponents').findBy('name', this.get('selected'));
  }),

  _previousSelectedTab: computed('childComponents.@each.name', 'previousSelectedNavItem', function() {
    return this.get('childComponents').findBy('name', this.get('previousSelected'));
  }),

  noInkBar: false,
  noInk: false,
  ariaLabel: null,
  previousInkBarPosition: 0,

  inkBarLeft: computed('_selectedTab.left', function() {
    return this.get('_selectedTab.left') || 0;
  }),

  inkBarRight: computed('wrapperWidth', '_selectedTab.width', 'inkBarLeft', function() {
    return this.get('wrapperWidth') - this.get('inkBarLeft') - (this.get('_selectedTab.width') || 0);
  }),

  tabsWidth: computed('childComponents.@each.width', function() {
    return this.get('childComponents').reduce((prev, t) => prev + t.get('width'), 0);
  }),

  shouldPaginate: computed('canvasWidth', function() {
    return this.get('tabsWidth') > this.get('canvasWidth');
  }),

  didReceiveAttrs() {
    this._super(...arguments);
    if (this.get('selected') !== this.get('previousSelected')) {
      this.setMovingRight();
      this.set('previousSelected', this.get('selectedNavItem'));
    }
  },

  didInsertElement() {
    this._super(...arguments);

    let updateCanvasWidth = () => {
      let { width: canvasWidth } = this.element.querySelector('md-tabs-canvas').getBoundingClientRect();
      let { width: wrapperWidth } = this.element.querySelector('md-pagination-wrapper').getBoundingClientRect();
      this.set('canvasWidth', canvasWidth);
      this.set('wrapperWidth', wrapperWidth);
    };

    window.addEventListener('resize', updateCanvasWidth);
    window.addEventListener('orientationchange', updateCanvasWidth);
    this.updateCanvasWidth = updateCanvasWidth;
  },

  didRender() {
    this._super(...arguments);
    this.updateCanvasWidth();
  },

  willDestroyElement() {
    this._super(...arguments);
    window.removeEventListener('resize', this.updateCanvasWidth);
    window.removeEventListener('orientationchange', this.updateCanvasWidth);
  },

  setMovingRight() {
    let movingRight = this.get('_previousSelectedTab.left') < this.get('_selectedTab.left');
    this.set('movingRight', movingRight);
  },

  currentOffset: 0,
  canPageBack: computed.gt('currentOffset', 0),
  canPageForward: computed('wrapperWidth', 'currentOffset', 'canvasWidth', function() {
    return this.get('wrapperWidth') - this.get('currentOffset') > this.get('canvasWidth');
  }),

  actions: {
    previousPage() {
      let tab = this.get('childComponents').find((t) => {
        return t.get('left') >= this.get('currentOffset');
      });
      if (tab) {
        let left = Math.max(0, tab.get('left') - this.get('canvasWidth'));
        this.set('currentOffset', left);
        this.set('paginationStyle', htmlSafe(`transform: translate3d(-${left}px, 0px, 0px);`));
      }
    },

    nextPage() {
      let tab = this.get('childComponents').find((t) => {
        return t.get('left') + t.get('width') > this.get('canvasWidth');
      });
      if (tab) {
        this.set('currentOffset', tab.get('left'));
        this.set('paginationStyle', htmlSafe(`transform: translate3d(-${tab.get('left')}px, 0px, 0px);`));
      }
    },

    onChange(selected) {
      // support non DDAU scenario
      if (this.get('onChange')) {
        this.sendAction('onChange', selected.get('name'));
      } else {
        this.set('selected', selected.get('name'));
      }
    }
  }
});
