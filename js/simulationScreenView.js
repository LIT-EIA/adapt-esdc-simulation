define([
  'core/js/adapt'
], function (Adapt) {
  'use strict';

  var SimulationScreenView = Backbone.View.extend({
    events: {
      'click .simulation-action-element': 'handleAction',
      'change .simulation-action-element': 'handleAction',
      'input .simulation-action-element': 'handleAction'
    },

    initialize: function () {
      Backbone.View.prototype.initialize.call(this);
      console.log('simulation screen view this: ', this);
      var _childItems = this.model.get('_childItems')
      _childItems.forEach(function (action, index) {
        _childItems[index].id = `screen-action-${index}`;
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
      this.$el.html(template(data));
      return this;
    },

    handleAction: function (e) {
      var eventType = e.type;

      switch (eventType) {
        case 'click':
          this.handleClick(e);
          break;
        case 'change':
          this.handleChange(e);
          break;
        case 'input':
          this.handleInput(e);
          break;
        default:
          console.log('Unhandled event type:', eventType);
      }
    },

    handleClick: function(e){
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      console.log(action);
    },

    handleChange: function(e){
      console.log('action listener: ', e);
    },

    handleInput: function(e){
      console.log('action listener: ', e);
    }

  });

  return SimulationScreenView;

});
