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
      'submit .simulation-form': 'handleOriginalSubmitForm',
      'click .action-container': 'handleFallbackAction'
    },

    initialize: function () {
      Backbone.View.prototype.initialize.call(this);
      var self = this;
      this.componentID = this.model.get('componentID');
      var _childItems = this.model.get('_childItems')
      _childItems.forEach(function (action, index) {
        var childIndex = index;
        _childItems[childIndex].id = `screen-action-${childIndex}`;
        _childItems[childIndex].type = {
          input: action._actionType === 'input',
          select: action._actionType === 'select',
          click: action._actionType === 'click',
          button: action._actionType === 'click' && action._clickType === 'button',
          link: action._actionType === 'click' && action._clickType === 'link'
        };
        _childItems[childIndex]._fontSize = action._fontSize || 12;
        _childItems[childIndex]._prefilled = {
          placeholder: action._prefilledType === 'placeholder',
          text: action._prefilledType === 'text'
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
            _childItems[childIndex]._form[formIndex]._fontSize = action._fontSize || 12;
            _childItems[childIndex]._form[formIndex]._prefilled = {
              placeholder: action._prefilledType === 'placeholder',
              text: action._prefilledType === 'text'
            };
          });
        }
        var simulationWrapperDefaultWidth = 840;
        self.model.set('simulationWrapperDefaultWidth', simulationWrapperDefaultWidth);
        var simulationDefaultFocusOutlineWidth = 3;
        self.model.set('simulationDefaultFocusOutlineWidth', simulationDefaultFocusOutlineWidth);
      });
      var simulationWrapperObserver = new MutationObserver(function (mutations, me) {
        self.adjustFontSize();
        var subElement = self.$el.closest('.simulation-wrapper');
        var simulationGraphicEl;
        if (subElement.find('.simulation-graphic')) {
          simulationGraphicEl = subElement.find('.simulation-graphic');
        }
        if (subElement.length) {
          var toolbarUndoBtn = subElement.find('.simulation-toolbar .undo');
          var toolbarMessageBtn = subElement.find('.simulation-toolbar .show-instructions');
          if (toolbarUndoBtn) {
            if (self.model && self.model.get('_index') == 0) {
              toolbarUndoBtn.toggleClass('disabled-undo', true);
              toolbarUndoBtn.attr('aria-disabled', true);
              toolbarUndoBtn.attr('aria-label', "Go back | No existing previous steps.");
            }
            else {
              toolbarUndoBtn.toggleClass('disabled-undo', false);
              toolbarUndoBtn.attr('aria-disabled', false);
              toolbarUndoBtn.attr('aria-label', "Go back");
            }
          }

          if (toolbarMessageBtn) {
            var screenMessage = self.model.get('body');
            if (!screenMessage) {
              toolbarMessageBtn.toggleClass('disabled-message', true);
              toolbarMessageBtn.attr('aria-disabled', true);
              toolbarMessageBtn.attr('aria-label', "Show Instructions | No instructions available for this screen.");
            } else {
              toolbarMessageBtn.toggleClass('disabled-message', false);
              toolbarMessageBtn.attr('aria-disabled', false);
              toolbarMessageBtn.attr('aria-label', "Show Instructions");
            }
          }
        }
      });
      simulationWrapperObserver.observe(self.$el[0], {
        childList: true,
        subtree: true
      });

      this.model.set('_childItems', _childItems);
      var screenMessage = this.model.get('body');
      if (screenMessage) {
        var simulationGraphicObserver = new MutationObserver(function (mutations, me) {
          var subElement = self.$el.closest('.simulation-graphic').find('.simulation-action-element, .simulation-form-element');
          if (subElement.length) {
            Adapt.trigger('simulation-notify:prompt', {
              body: screenMessage,
              _prompts: [
                {
                  promptText: "OK"
                }
              ],
              onCloseRefocusEl: subElement[0]
            });
            me.disconnect();
          }
        });

        simulationGraphicObserver.observe(self.$el[0], {
          childList: true,
          subtree: true
        });
      }
      this.listenTo(Adapt, 'device:resize', this.adjustFontSize);
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
      }
    },

    handleKeypressSubmit: function (e) {
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
              message: action.matchFailure || self.model.get('incorrectFallback'),
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
              message: action.selectFailure || self.model.get('incorrectFallback'),
              userValue: fieldValue
            });
          }
        }
      });
      if (errors.length > 0) {
        var template = Handlebars.templates['simulationErrors'];
        var messageHTML = template({ errors: errors });
        Adapt.trigger('simulation-notify:prompt', {
          body: messageHTML,
          _prompts: [
            {
              promptText: "OK"
            }
          ],
          onCloseRefocusEl: $(e.target)
        });
      } else {
        if (formModel._isSuccess) {
          var bodyData = {
            _successBody: formModel._successBody,
            componentID: self.model.get('componentID')
          }
          var successBodyTemplate = Handlebars.templates['simulationScreenSuccess'];
          Adapt.trigger('simulation-notify:prompt', {
            body: successBodyTemplate(bodyData),
            onCloseRefocusEl: $(e.target)
          });
          $('.confirm-success').one('click', function (e) {
            var button = $(e.target);
            var componentID = button.attr('data-component-id');
            self.handleConfirmSuccess(componentID);
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
      var self = this;
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      if (action._actionType === 'click') {
        if (action._isFailure || action._isSuccess) {
          var failureBody = action._failureBody ? action._failureBody : this.model.get('incorrectFallback');
          if (action._isSuccess) {
            var bodyData = {
              _successBody: action._successBody,
              componentID: self.model.get('componentID')
            }
            var successBodyTemplate = Handlebars.templates['simulationScreenSuccess'];
            Adapt.trigger('simulation-notify:prompt', {
              body: successBodyTemplate(bodyData),
              onCloseRefocusEl: $(e.target)
            });
            $('.confirm-success').one('click', function (e) {
              var button = $(e.target);
              var componentID = button.attr('data-component-id');
              self.handleConfirmSuccess(componentID);
            });
          } else {
            Adapt.trigger('simulation-notify:prompt', {
              body: failureBody,
              _prompts: [
                {
                  promptText: "OK"
                }
              ],
              onCloseRefocusEl: $(e.target)
            });
          }
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
      var self = this;
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
            var bodyData = {
              _successBody: action._successBody,
              componentID: self.model.get('componentID')
            }
            var successBodyTemplate = Handlebars.templates['simulationScreenSuccess'];
            Adapt.trigger('simulation-notify:prompt', {
              body: successBodyTemplate(bodyData),
              onCloseRefocusEl: $(e.target)
            });
            $('.confirm-success').one('click', function (e) {
              var button = $(e.target);
              var componentID = button.attr('data-component-id');
              self.handleConfirmSuccess(componentID);
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
          Adapt.trigger('simulation-notify:prompt', {
            body: selectFailure,
            _prompts: [
              {
                promptText: "OK"
              }
            ],
            onCloseRefocusEl: $(e.target)
          });
        }
      }
    },

    handleInput: function (e) {
      var self = this;
      var actionId = $(e.target).attr('data-id');
      var action = this.model.get('_childItems').find(item => item.id === actionId);
      if (action._actionType === 'input') {

        var inputString = $(e.target).val();
        var criteriaList = action._matchTextItems;
        var isMatched = this.matchString(inputString, criteriaList);
        if (isMatched) {
          if (action._isSuccess) {
            var bodyData = {
              _successBody: action._successBody,
              componentID: self.model.get('componentID')
            }
            var successBodyTemplate = Handlebars.templates['simulationScreenSuccess'];
            Adapt.trigger('simulation-notify:prompt', {
              body: successBodyTemplate(bodyData),
              onCloseRefocusEl: $(e.target)
            });
            $('.confirm-success').one('click', function (e) {
              var button = $(e.target);
              var componentID = button.attr('data-component-id');
              self.handleConfirmSuccess(componentID);
            });
          } else if (action._isFailure) {
            var failureBody = action._failureBody ? action._failureBody : this.model.get('incorrectFallback');
            Adapt.trigger('simulation-notify:prompt', {
              body: failureBody,
              _prompts: [
                {
                  promptText: "OK"
                }
              ],
              onCloseRefocusEl: $(e.target)
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

    handleConfirmSuccess: function (componentID) {
      Adapt.trigger('simulationSuccess', {
        componentID: componentID
      });
    },

    handleOriginalSubmitForm: function(e){
      e.preventDefault();
    },

    handleFallbackAction: function (e) {
      var target = $(e.target);
      if (target.hasClass('action-container')) {
        console.log('Warning: clicked a spot with no mapping');
        var focusElement = $(this.previousElement) || this.$el.find('.action-container');
        var message = this.model.get('_fallbackMessage');
        if (message) {
          Adapt.trigger('simulation-notify:prompt', {
            body: message,
            _prompts: [
              {
                promptText: "OK"
              }
            ],
            onCloseRefocusEl: focusElement
          });
        }
      } else {
        this.previousElement = document.activeElement;
      }
    },

    adjustFontSize: function () {
      var componentDiv = $(`div[data-adapt-id="${this.componentID}"]`);
      var simulationWrapperCurrentWidth = componentDiv.find('.simulation-wrapper').width();
      var simulationWrapperDefaultWidth = this.model.get('simulationWrapperDefaultWidth');
      var simulationDefaultFocusOutlineWidth = this.model.get('simulationDefaultFocusOutlineWidth');
      var outlineRatio = simulationDefaultFocusOutlineWidth / simulationWrapperDefaultWidth;
      var newOutlineSize = outlineRatio * simulationWrapperCurrentWidth;
      componentDiv.css(`--simulation-outline-width`, newOutlineSize) + 'px!important';
      var _childItems = this.model.get('_childItems');
      _childItems.forEach(function (action, index) {
        var childIndex = index;
        if (_childItems[childIndex]._fontSize) {
          var fontWidthRatio = _childItems[childIndex]._fontSize / simulationWrapperDefaultWidth;
          var itemID = _childItems[childIndex].id;
          var field = componentDiv.find(`[data-id="${itemID}"]`);
          field.css("font-size", fontWidthRatio * simulationWrapperCurrentWidth);
        }
        if (_childItems[childIndex]._isForm) {
          _childItems[childIndex]._form.forEach(function (action, index) {
            var formIndex = index;
            if (_childItems[childIndex]._form[formIndex]._fontSize) {
              var formFontWidthRatio = _childItems[childIndex]._form[formIndex]._fontSize / simulationWrapperDefaultWidth;
              var itemID = _childItems[childIndex]._form[formIndex].id;
              var field = componentDiv.find(`[data-id="${itemID}"]`);
              field.css("font-size", formFontWidthRatio * simulationWrapperCurrentWidth);
            }
          });
        }
      });
    },

    matchString: function (inputString, criteriaList) {
      var matched = false;

      criteriaList.forEach(function (criteria) {
        var matchValue = criteria._matchValue;
        var caseInsensitive = criteria._caseInsensitive;
        var matchRegex = criteria._matchRegex;
        var matchEmptyString = criteria._matchEmptyString;

        if (matchRegex) {
          var regexFlags = caseInsensitive ? 'i' : '';
          var regex = new RegExp(matchValue, regexFlags);

          if (regex.test(inputString)) {
            matched = true;
          }
        } else {
          if(matchEmptyString){
            if (inputString === '') {
              matched = true;
            }
          } else if (caseInsensitive) {
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
