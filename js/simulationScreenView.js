define([
  'core/js/adapt'
], function (Adapt) {
  'use strict';

  var SimulationScreenView = Backbone.View.extend({
    events: {
      'click .simulation-action-element': 'handleAction',
      'change .simulation-action-element': 'handleAction',
      'input .simulation-action-element': 'handleAction',
      'keypress .simulation-action-element': 'handleAction'
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
        case 'keypress':
          if (e.which === 13) {
            this.handleClick(e);
          }
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

    handleClick: function (e) {
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      if (action._actionType === 'click') {
        console.log('click action:', action);
        if (action._failure._isFailure) {
          Adapt.trigger('notify:popup', {
            title: 'Incorrect Action',
            body: action._failure.body
          });
        }
      }
    },

    handleChange: function (e) {
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      if (action._actionType === 'select') {
        console.log('change action:', action);
        if (action._failure._isFailure) {
          Adapt.trigger('notify:popup', {
            title: 'Incorrect Action',
            body: action._failure.body
          });
        }
      }
    },

    handleInput: function (e) {
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      if (action._actionType === 'input') {
        if (action._failure._isFailure) {
          Adapt.trigger('notify:popup', {
            title: 'Incorrect Action',
            body: action._failure.body
          });
        } else {
          console.log('input action:', action);
          var inputString = $(e.target).val();
          var criteriaList = action._matchTextItems;
          var isMatched = this.matchString(inputString, criteriaList);
          if(isMatched){
            var eventData = {
              id: action._goTo,
              componentID: this.model.get('componentID')
            }
            Adapt.trigger('simulationloadscreen', eventData);
          }
        }
      }
    },

    matchString: function (inputString, criteriaList) {
      var matched = false;

      criteriaList.forEach(function (criteria) {
        var matchValue = criteria._matchValue;
        var caseInsensitive = criteria._caseInsensitive;
        var matchRegex = criteria._matchRegex;

        if (matchRegex) {
          var regexFlags = caseInsensitive ? 'i' : '';
          var regex = new RegExp(matchValue, regexFlags);

          if (regex.test(inputString)) {
            matched = true;
          }
        } else {
          if (caseInsensitive) {
            if (inputString.toLowerCase() === matchValue.toLowerCase()) {
              matched = true;
            }
          } else {
            if (inputString === matchValue) {
              matched = true;
            }
          }
        }
      });

      return matched;
    }

  });

  return SimulationScreenView;

});
