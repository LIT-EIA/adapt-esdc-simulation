define([
  'core/js/adapt'
], function (Adapt) {
  'use strict';

  var SimulationScreenView = Backbone.View.extend({
    events: {
      'click .simulation-action-element': 'handleAction',
      'change .simulation-action-element': 'handleAction',
      'change .simulation-action-element': 'handleAction'
    },

    initialize: function () {
      Backbone.View.prototype.initialize.call(this);
      console.log('simulation screen view this: ', this);
      var _childItems = this.model.get('_childItems')
      _childItems.forEach(function (action, index) {
        _childItems[index].type = {
          input: action._actionType === 'input',
          select: action._actionType === 'select',
          click: action._actionType === 'click'
        };
      });
      this.model.set('_childItems', _childItems);
    },


    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates['simulationScreen'];
      console.log('screen view template data: ', template(data));

      this.$el.html(template(data));

      return this;
    },

    handleAction: function(e) {

    }

  });

  return SimulationScreenView;

});
