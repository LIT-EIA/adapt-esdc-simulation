define([
  'core/js/adapt'
], function (Adapt) {
  'use strict';

  var SimulationScreenView = Backbone.View.extend({
    events: {
      'click .simulation-action-element': 'handleAction',
      'change .simulation-action-element': 'handleAction',
      'input .simulation-action-element': 'handleAction',
      'keypress .simulation-action-element': 'handleAction',
      'click .simulation-form .form-submit': 'handleSubmit',
      'keypress .simulation-form .form-submit': 'handleKeypressSubmit',
    },

    initialize: function () {
      Backbone.View.prototype.initialize.call(this);
      ////console.log('simulation screen view this: ', this);
      var _childItems = this.model.get('_childItems')
      _childItems.forEach(function (action, index) {
        var childIndex = index;
        _childItems[childIndex].id = `screen-action-${childIndex}`;
        _childItems[childIndex].type = {
          input: action._actionType === 'input',
          select: action._actionType === 'select',
          click: action._actionType === 'click'
        };
        if (_childItems[childIndex]._isForm) {
          _childItems[childIndex]._form.forEach(function (action, index) {
            var formIndex = index;
            _childItems[childIndex]._form[formIndex].id = `screen-action-${childIndex}-${formIndex}`;
            _childItems[childIndex]._form[formIndex].type = {
              input: action._actionType === 'input',
              select: action._actionType === 'select',
              submit: action._actionType === 'submit'
            };
          });
        }

      });
      this.model.set('_childItems', _childItems);
    },


    render: function () {
      var data = this.model.toJSON();
      //console.log(data);
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
        //console.log('Unhandled event type:', eventType);
      }
    },

    handleKeypressSubmit: function(e){
      if (e.which === 13) {
        this.handleSubmit(e);
      }
    },

    handleSubmit: function (e) {
      var self = this;
      var form = $(e.target).parent();
      var formId = $(form).attr('data-id');
      var formModel = this.model.get('_childItems').find(item => item.id === formId);
      var formActions = formModel._form;
      var elements = $(form).find('input, select');

      var submitId = $(e.target).attr('data-id');
      var submitAction = formActions.find(item => item.id === submitId);

      var errors = [];
      $.each(elements, function () {
        var actionId = $(this).attr('data-id');
        var action = formActions.find(item => item.id === actionId);
        var fieldValue = $(this).val();
        if (action._actionType === 'input') {
          var inputString = fieldValue;
          var criteriaList = action._matchTextItems;
          var isMatched = self.matchString(inputString, criteriaList);
          if (!isMatched) {
            errors.push({
              name: action.title,
              message: action.matchFailure,
              userValue: fieldValue
            });
          }
        } else if (action._actionType === 'select') {
          var selectedOption = fieldValue;
          var correctOption = action._selectOptions.filter(function (option) {
            return option._correctOption === true
          })[0];
          var correctOptionValue = correctOption._selectValue;
          if (selectedOption !== correctOptionValue) {
            errors.push({
              name: action.title,
              message: action.selectFailure,
              userValue: fieldValue
            });
          }
        }
      });
      if (errors.length > 0) {
        var template = Handlebars.templates['simulationErrors'];
        var messageHTML = template({ errors: errors });
        Adapt.trigger('simulation-notify:popup', {
          title: 'Incorrect Action',
          body: messageHTML
        });
      } else {
        if (formModel._isSuccess) {
          Adapt.trigger('simulation-notify:popup', {
            title: 'Completion Message',
            body: formModel._successBody
          });
        } else {
          var eventData = {
            id: formModel._goTo,
            componentID: self.model.get('componentID')
          }
          Adapt.trigger('simulationloadscreen', eventData);
        }
      }
    },

    handleClick: function (e) {
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      if (action._actionType === 'click') {
        if (action._isFailure || action._isSuccess) {
          var failureBody = action._failureBody ? action._failureBody : this.model.get('incorrectFallback');
          Adapt.trigger('simulation-notify:popup', {
            title: action._isFailure ? 'Incorrect Action' : 'Completion Message',
            body: action._isFailure ? failureBody : action._successBody
          });
        } else {
          var eventData = {
            id: action._goTo,
            componentID: this.model.get('componentID')
          }
          Adapt.trigger('simulationloadscreen', eventData);
        }
      }
    },

    handleChange: function (e) {
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      if (action._actionType === 'select') {
        var selectedOption = $(e.target).val();
        var correctOption = action._selectOptions.filter(function (option) {
          return option._correctOption === true
        })[0];
        var correctOptionValue = correctOption._selectValue;
        if (selectedOption === correctOptionValue) {
          if (action._isSuccess) {
            Adapt.trigger('simulation-notify:popup', {
              title: 'Completion Message',
              body: action._successBody
            });
          } else {
            var eventData = {
              id: action._goTo,
              componentID: this.model.get('componentID')
            }
            Adapt.trigger('simulationloadscreen', eventData);
          }
        } else {
            var selectFailure = action.selectFailure ? action.selectFailure : this.model.get('incorrectFallback');
            Adapt.trigger('simulation-notify:popup', {
              title: 'Incorrect Action',
              body: selectFailure
            });
        }
      }
    },

    handleInput: function (e) {
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      if (action._actionType === 'input') {

          var inputString = $(e.target).val();
          var criteriaList = action._matchTextItems;
          var isMatched = this.matchString(inputString, criteriaList);
          if (isMatched) {
            if (action._isFailure || action._isSuccess) {
              var failureBody = action._failureBody ? action._failureBody : this.model.get('incorrectFallback');
              Adapt.trigger('simulation-notify:popup', {
                title: action._isFailure ? 'Incorrect Action' : 'Completion Message',
                body: action._isFailure ? failureBody : action._successBody
              });
            } else {
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
