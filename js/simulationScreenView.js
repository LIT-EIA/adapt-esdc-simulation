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
      'change .simulation-form-element': 'handleActionForm',
      'input .simulation-form-element': 'handleActionForm',
      'keypress .simulation-form-element': 'handleActionForm',
      'click .simulation-form .form-submit': 'handleSubmit',
      'keypress .simulation-form .form-submit': 'handleKeypressSubmit',
      'click .simulation-form-element:not(.form-submit)': 'handleAction',
      'keypress .simulation-form-element:not(.form-submit)': 'handleAction',
      'submit .simulation-form': 'handleOriginalSubmitForm',
      'click .action-container': 'handleFallbackAction'
    },

    initialize: function () {
      Backbone.View.prototype.initialize.call(this);
      var self = this;
      var prefilledTemplateOptions = this.model.get('fieldsData');
      this.componentID = this.model.get('componentID');
      var _childItems = this.model.get('_childItems');
      _childItems.forEach(function (action, index) {
        var childIndex = index;
        var child = _childItems[childIndex];
        var templatePrefilledValue = child._prefilledValue;
        templatePrefilledValue = child._prefilledWithPrevious ? "{{previous}}" : child._prefilledWithDate ? "{{today}}" : templatePrefilledValue;
        var readableID = self.stringToCamelCase(child.title);
        var previousValue = prefilledTemplateOptions[readableID];
        prefilledTemplateOptions.previous = previousValue ? previousValue : '';
        child._previousValue = prefilledTemplateOptions.previous;
        var prefilledValue = Handlebars.compile(templatePrefilledValue)(prefilledTemplateOptions);
        child._prefilledValueInterpolated = prefilledValue;
        child._isCheckedByDefault = action._checkboxInitialState == 'checked';
        if (child._isForm) {
          child._form.forEach(function (action, index) {
            var formIndex = index;
            var childForm = _childItems[childIndex]._form[formIndex];
            var templatePrefilledValue = childForm._prefilledValue;
            templatePrefilledValue = childForm._prefilledWithPrevious ? "{{previous}}" : childForm._prefilledWithDate ? "{{today}}" : templatePrefilledValue;
            var readableID = self.stringToCamelCase(childForm.title);
            var previousValue = prefilledTemplateOptions[readableID];
            prefilledTemplateOptions.previous = previousValue ? previousValue : '';
            childForm._previousValue = prefilledTemplateOptions.previous;
            var prefilledValue = Handlebars.compile(templatePrefilledValue)(prefilledTemplateOptions);
            childForm._prefilledValueInterpolated = prefilledValue;
            childForm._isCheckedByDefault = action._checkboxInitialState == 'checked';
          });
        };
      });
      var simulationWrapperDefaultWidth = 840;
      self.model.set('simulationWrapperDefaultWidth', simulationWrapperDefaultWidth);
      var simulationDefaultFocusOutlineWidth = 3;
      self.model.set('simulationDefaultFocusOutlineWidth', simulationDefaultFocusOutlineWidth);
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
              toolbarUndoBtn.attr('aria-label', "No existing previous steps.");
            }
            else {
              toolbarUndoBtn.toggleClass('disabled-undo', false);
              toolbarUndoBtn.attr('aria-disabled', false);
              toolbarUndoBtn.attr('aria-label', "");
            }
          }

          if (toolbarMessageBtn) {
            var screenMessage = self.model.get('body');
            if (!screenMessage) {
              toolbarMessageBtn.toggleClass('disabled-message', true);
              toolbarMessageBtn.attr('aria-disabled', true);
              toolbarMessageBtn.attr('aria-label', "No instructions available for this screen.");
            } else {
              toolbarMessageBtn.toggleClass('disabled-message', false);
              toolbarMessageBtn.attr('aria-disabled', false);
              toolbarMessageBtn.attr('aria-label', "");
            }
          }
        }
      });
      simulationWrapperObserver.observe(self.$el[0], {
        childList: true,
        subtree: true
      });

      var screenMessage = this.model.get('body');
      var simulationGraphicObserver = new MutationObserver(function (mutations, me) {
        var subElement = self.$el.closest('.simulation-graphic').find('.simulation-action-element, .simulation-form-element');
        if (subElement.length) {
          if (screenMessage) {
            Adapt.trigger('simulation-notify:prompt', {
              body: screenMessage,
              _prompts: [
                {
                  promptText: "OK"
                }
              ],
              onCloseRefocusEl: subElement[0]
            });
          }
          me.disconnect();
        }
      });

      simulationGraphicObserver.observe(self.$el[0], {
        childList: true,
        subtree: true
      });
      this.listenTo(Adapt, 'device:resize', this.adjustFontSize);
    },

    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates['simulationScreen'];
      this.$el.html(template(data));
      this.postRender();
      return this;
    },

    postRender: function () {
      this.setSelectFields();
      this.setIndicator();
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

    handleActionForm: function (e) {
      var eventType = e.type;
      switch (eventType) {
        case 'change':
          this.handleChangeForm(e);
          break;
        case 'input':
          this.handleInputForm(e);
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
      var form = $(e.target).parents('.simulation-form');
      var formId = $(form).attr('data-id');
      var formModel = this.model.get('_childItems').find(item => item.id === formId);
      var formActions = formModel._form;
      var elements = $(form).find('input, select');

      var submitId = $(e.target).attr('data-id');
      var submitAction = formActions.find(item => item.id === submitId);

      var errors = [];
      var fieldsData = this.model.get('fieldsData');
      $.each(elements, function () {
        var actionId = $(this).attr('data-id');
        var action = formActions.find(item => item.id === actionId);
        var fieldValue = $(this).val();
        var readableID = self.stringToCamelCase(action.title);
        if (fieldValue) {
          fieldsData[readableID] = fieldValue;
        }
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
          var correctOptionValue = correctOption ? correctOption._selectValue : selectedOption;
          if (selectedOption !== correctOptionValue) {
            errors.push({
              name: action.title,
              message: action.selectFailure || self.model.get('incorrectFallback'),
              userValue: fieldValue
            });
          }
        } else if (action._actionType === 'checkbox') {
          console.log('action type checkbox this: ', $(this));
          if ((action._checkboxMatchState == 'checked' && !$(this).prop('checked')) ||
            (action._checkboxMatchState == 'unchecked' && $(this).prop('checked'))) {
            errors.push({
              name: action.title,
              message: action.matchFailure || self.model.get('incorrectFallback'),
              userValue: $(this).prop('checked') ? 'checked' : 'unchecked'
            });
          }
        }
      });
      self.model.set('fieldsData', fieldsData);
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
        self.handleCompleteTask(formModel);
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
      var action = this.getActionModelById(actionId);
      if (action._actionType === 'click') {
        if (action._isFailure || action._isSuccess) {
          var failureBody = action._failureBody ? action._failureBody : this.model.get('incorrectFallback');
          if (action._isSuccess) {
            self.handleCompleteTask(action);
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
          self.handleCompleteTask(action);
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
      var action = this.getActionModelById(actionId);
      if (action._actionType === 'select') {
        var selectedOption = $(e.target).val();
        var fieldsData = this.model.get('fieldsData');
        var readableID = self.stringToCamelCase(action.title);
        if (selectedOption) {
          fieldsData[readableID] = selectedOption;
        }
        self.model.set('fieldsData', fieldsData);
        var correctOption = action._selectOptions.filter(function (option) {
          return option._correctOption === true
        })[0];
        var correctOptionValue = correctOption ? correctOption._selectValue : selectedOption;
        if (selectedOption === correctOptionValue) {
          self.handleCompleteTask(action);
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
      } else if (action._actionType === 'checkbox') {
        console.log('action checkbox single: ', action);

        // This block of code (_isSuccess, ) is repetitive, maybe we can create a function instead
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
    },

    handleChangeForm: function (e) {
      var self = this;
      var actionId = $(e.target).attr('data-id');
      var childItems = this.model.get('_childItems');
      childItems.forEach(function (item) {
        var form = item._form;
        if (form.length) {
          var action = form.find(item => item.id === actionId);
          if (action._actionType === 'select') {
            var selectedOption = $(e.target).val();
            var fieldsData = self.model.get('fieldsData');
            var readableID = self.stringToCamelCase(action.title);
            if (selectedOption) {
              fieldsData[readableID] = selectedOption;
            }
            self.model.set('fieldsData', fieldsData);
            var correctOption = action._selectOptions.filter(function (option) {
              return option._correctOption === true
            })[0];
            var correctOptionValue = correctOption ? correctOption._selectValue : selectedOption;
            if (selectedOption === correctOptionValue) {
              self.handleCompleteTask(action);
            }
          }  else if (action._actionType === 'checkbox') {
            if ((action._checkboxMatchState == 'checked' && $(e.target).prop('checked')) || 
            (action._checkboxMatchState == 'unchecked' && !$(e.target).prop('checked'))) {
              self.handleCompleteTask(action);
            }
          }
        }
      })
    },

    handleInput: function (e) {
      var self = this;
      var actionId = $(e.target).attr('data-id');
      var action = this.getActionModelById(actionId);
      if (action._actionType === 'input') {
        var inputString = $(e.target).val();
        var criteriaList = action._matchTextItems;
        var isMatched = this.matchString(inputString, criteriaList);
        if (isMatched) {
          var fieldsData = this.model.get('fieldsData');
          var readableID = this.stringToCamelCase(action.title);
          if (inputString) {
            fieldsData[readableID] = inputString;
          }
          self.model.set('fieldsData', fieldsData);
          self.handleCompleteTask(action);
          // This block of code (_isSuccess, ) is repetitive, maybe we can create a function instead
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

    updateCharacterCount: function (options) {
      if (options.action._characterCounter) {
        var inputString = options.target.val();
        var charactersLength = inputString.length;
        var charactersLimit = options.action._characterCounterLimit
        var charactersLeft = charactersLimit - charactersLength;
        var counterElement = $(`div[data-adapt-id="${this.componentID}"] .action-container [counter-data-id="${options.action.id}"] span.character-count`);
        counterElement.text(charactersLeft).toggleClass('zero-character', charactersLeft === 0);
      }
    },

    handleInputForm: function (e) {
      var self = this;
      var actionId = $(e.target).attr('data-id');
      var childItems = this.model.get('_childItems');
      childItems.forEach(function (item) {
        var form = item._form;
        if (form.length) {
          var action = form.find(item => item.id === actionId);
          if (action._actionType === 'input') {
            var target = $(e.target);
            self.updateCharacterCount({ target: target, action: action });
            var inputString = target.val();
            var criteriaList = action._matchTextItems;
            var isMatched = self.matchString(inputString, criteriaList);
            if (isMatched) {
              self.handleCompleteTask(action);
            }
          }
        }
      })
    },

    handleConfirmSuccess: function (componentID) {
      Adapt.trigger('simulationSuccess', {
        componentID: componentID
      });
    },

    handleOriginalSubmitForm: function (e) {
      e.preventDefault();
    },

    handleCompleteTask: function (task) {
      var self = this;
      if (task._trackAsTask) {
        var tasks = self.model.get('tasks');
        var currentTaskAria = $(`div[data-adapt-id="${this.componentID}"] .simulation-widget .sr-current-task`);
        var completingTask = $(`div[data-adapt-id="${this.componentID}"] .simulation-task-list .checkbox-group[data-task-id="${task.id}"]`);
        var completingTaskAria = completingTask.find('.completed-task');
        completingTask.addClass('checked');
        completingTask.find('input[type="checkbox"]').prop('checked', true);
        completingTask.removeClass('current-task');
        completingTask.addClass('previous-task');
        completingTaskAria.text('Completed');

        var nextTasksSticky = $(`div[data-adapt-id="${this.componentID}"] .simulation-task-list.sticky .checkbox-group:not(.previous-task, .auto-task)`);
        var nextTaskSticky = nextTasksSticky[0];
        var nextTasksMain = $(`div[data-adapt-id="${this.componentID}"] .simulation-task-list.after .checkbox-group:not(.previous-task, .auto-task)`);
        var nextTaskMain = nextTasksMain[0];
        var nextTaskLabel = $(nextTaskMain).find('div.label').text();

        if (nextTaskMain) {
          var currentStickyTaskWrapper = $(`div[data-adapt-id="${this.componentID}"] .simulation-task-list.current`);
          var offset = nextTaskSticky.offsetTop;
          setTimeout(function () {
            currentStickyTaskWrapper[0].scrollTo({
              top: offset,
              behavior: 'smooth',
            })
          }, 150);
          $(nextTaskSticky).addClass('current-task');
          $(nextTaskMain).addClass('current-task');
          var ariaText = nextTaskLabel ? `Task Completed. Next Task: ${nextTaskLabel}` : 'All tasks completed.';
          currentTaskAria.text(ariaText);

          var completingTaskID = completingTask.attr('data-task-id')
          var nextTaskID = $(nextTaskMain).attr('data-task-id');
          var nextTaskModel = tasks.find(task => task.id === nextTaskID);
          var completingTaskModel = tasks.find(task => task.id === completingTaskID);

          if (nextTaskModel._isForm) {
            var nextTaskTriggerElement = nextTaskModel._form.filter(task => task.type.submit)
          } else {
            var nextTaskTriggerElement = [nextTaskModel];
          }

          if (completingTaskModel._isForm) {
            var completingTaskTriggerElement = completingTaskModel._form.filter(task => task.type.submit)
          } else {
            var completingTaskTriggerElement = [completingTaskModel];
          }

          if (completingTaskTriggerElement.length) {
            completingTaskTriggerElement.forEach(function (trigger) {
              var triggerElement = $(`div[data-adapt-id="${self.componentID}"] .action-container [data-id="${trigger.id}"]`);
              var triggerWrapper = triggerElement.parent();
              triggerWrapper.removeClass('indicator');
            })
          }

          if (nextTaskTriggerElement.length) {
            nextTaskTriggerElement.forEach(function (trigger) {
              var triggerElement = $(`div[data-adapt-id="${self.componentID}"] .action-container [data-id="${trigger.id}"]`);
              var triggerWrapper = triggerElement.parent();
              triggerWrapper.addClass('indicator');
            })
          }
        };
      };
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

    getActionModelById: function (actionId) {
      var action = this.model.get('_childItems').reduce(function (found, item) {
        if (found) return found;
        if (item.id === actionId) return item;
        if (item._isForm) {
          return item._form.find(function (formItem) {
            return formItem.id === actionId;
          }) || null;
        }
        return null;
      }, null);
      return action;
    },

    getFirstScreenTask: function () {
      var _childItems = this.model.get('_childItems');
      var firstTask;
      _childItems.forEach(function (action) {
        if (action._isForm) {
          action._form.forEach(function (action) {
            if (action._trackAsTask) {
              if (!firstTask) {
                firstTask = action
              }
            };
          });
        }
        if (action._trackAsTask) {
          if (!firstTask) {
            firstTask = action
          }
        };
      });
      return firstTask
    },

    setIndicator: function () {
      var task = this.getFirstScreenTask();
      if (task) {
        var taskElement = this.$el.find(`[data-id="${task.id}"]`);
        var taskWrapper = taskElement.parent();
        taskWrapper.addClass('indicator');
      }
    },

    setSelectFields: function () {
      var self = this;
      this.$el.find('.action-container select').each(function () {
        var select = $(this);
        var actionId = select.attr('data-id');
        var action = self.getActionModelById(actionId);
        if (action) {
          var selectedValue = action._selectWithPrevious && action._previousValue
            ? action._previousValue
            : action._selectOptions.reduce(function (found, item) {
              if (item._selectedDefault) {
                return item._selectValue;
              }
              return found;
            }, null);

          if (selectedValue) {
            select.find('option').filter(function () {
              return $(this).text() === selectedValue;
            }).prop('selected', true);
          }
        }
      });
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
        var child = _childItems[childIndex];
        if (child._fontSize) {
          var fontWidthRatio = child._fontSize / simulationWrapperDefaultWidth;
          var itemID = child.id;
          var field = componentDiv.find(`[data-id="${itemID}"]`);
          field.css("font-size", fontWidthRatio * simulationWrapperCurrentWidth);
        }
        if (child._isForm) {
          child._form.forEach(function (action, index) {
            var formIndex = index;
            var childForm = _childItems[childIndex]._form[formIndex];
            if (childForm._fontSize) {
              var formFontWidthRatio = childForm._fontSize / simulationWrapperDefaultWidth;
              var itemID = childForm.id;
              var field = componentDiv.find(`[data-id="${itemID}"]`);
              field.css("font-size", formFontWidthRatio * simulationWrapperCurrentWidth);
            }
          });
        }
      });
    },

    matchString: function (inputString, criteriaList) {
      var self = this;
      var matched = false;

      criteriaList.forEach(function (criteria) {
        var matchValue = criteria._matchValue;
        var caseInsensitive = criteria._caseInsensitive;
        var matchRegex = criteria._matchRegex;
        var matchEmptyString = criteria._matchEmptyString;
        var matchUsingDate = criteria._matchUsingDate;

        if (matchRegex) {
          var regexFlags = caseInsensitive ? 'i' : '';
          var regex = new RegExp(matchValue, regexFlags);

          if (regex.test(inputString)) {
            matched = true;
          }
        } else {
          if (matchEmptyString) {
            if (inputString === '') {
              matched = true;
            }
          } else if (caseInsensitive) {
            if (inputString.toLowerCase() === matchValue.toLowerCase()) {
              matched = true;
            }
          } else if (matchUsingDate) {
            var formattedDate = self.model.get('formattedDate');
            if (inputString === formattedDate) {
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
    },

    stringToCamelCase: function (str) {
      return str
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .map(function (word, index) {
          return index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
    }

  });

  return SimulationScreenView;

});
