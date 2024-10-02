define([
  'core/js/adapt',
  'core/js/views/componentView',
  './simulationScreenView',
  './helpers/simulationNotifyView'
], function (Adapt, ComponentView, SimulationScreenView, SimulationNotifyView) {
  'use strict';

  var SimulationView = ComponentView.extend({

    events: {
      'click .start-simulation': 'onStartSimulation',
      'click .simulation-toolbar .undo': 'onUndo',
      'click .simulation-toolbar .show-instructions': 'onShowInstructions',
      'click .simulation-toolbar .exit': 'onStopSimulation',
      'click .simulation-toolbar .expand': 'onExpand',
    },

    initialize: function () {
      ComponentView.prototype.initialize.call(this);
      this.screenHistory = [];
      this.currentViewData;
      this.listenToFullScreenChange();
      this.checkIfResetOnRevisit();
      this.listenToResize();
    },

    checkIfResetOnRevisit: function () {
      var isResetOnRevisit = this.model.get('_isResetOnRevisit');

      // If reset is enabled set defaults
      if (isResetOnRevisit) {
        this.model.reset(isResetOnRevisit);
      }
    },

    preRender: function () {
      var self = this;
      this.screens = this.model.get('_items');
      this.model.set('active', true);
      const globals = Adapt.course.get('_globals');
      var simulation = globals._components._simulation;
      this.model.set('simulation', simulation);
      var tasks = [];
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      this.model.set('formattedDate', formattedDate);
      this.screens.forEach(function (screen, index) {
        screen.formattedDate = formattedDate;
        screen._childItems.forEach(function (action, childIndex) {
          if (screen._childItems[childIndex]._isForm) {
            screen._childItems[childIndex]._form.forEach(function (action, formIndex) {
              if (screen._childItems[childIndex]._form[formIndex]._focusOnElement) {
                if(!screen.focusOnElement){
                  screen.focusOnElement = screen._childItems[childIndex]._form[formIndex];
                }
              };
              if (screen._childItems[childIndex]._form[formIndex]._trackAsTask) {
                tasks.push(screen._childItems[childIndex]._form[formIndex]);
              };
              if (screen._childItems[childIndex]._form[formIndex]._prefilledValue === '{{today}}') {
                screen._childItems[childIndex]._form[formIndex]._prefilledValue = formattedDate;
              }
              screen._childItems[childIndex]._form[formIndex].id = `screen-action-${index}-${childIndex}-${formIndex}`;
              screen._childItems[childIndex]._form[formIndex].type = {
                input: action._actionType === 'input',
                select: action._actionType === 'select',
                submit: action._actionType === 'submit',
                datepicker: action._actionType === 'input' && action._inputType === 'datepicker'
              };
              screen._childItems[childIndex]._form[formIndex]._fontSize = action._fontSize || 12;
              screen._childItems[childIndex]._form[formIndex]._prefilled = {
                placeholder: action._prefilledType === 'placeholder',
                text: action._prefilledType === 'text'
              };
            });
          }
          if (screen._childItems[childIndex]._focusOnElement) {
            if(!screen.focusOnElement){
              screen.focusOnElement = screen._childItems[childIndex]
            }
          };
          if (screen._childItems[childIndex]._trackAsTask) {
            tasks.push(screen._childItems[childIndex]);
          };
          if (screen._childItems[childIndex]._prefilledValue === '{{today}}') {
            screen._childItems[childIndex]._prefilledValue = formattedDate;
          }
          screen._childItems[childIndex].id = `screen-action-${index}-${childIndex}`;
          screen._childItems[childIndex].type = {
            input: action._actionType === 'input',
            select: action._actionType === 'select',
            click: action._actionType === 'click',
            button: action._actionType === 'click' && action._clickType === 'button',
            link: action._actionType === 'click' && action._clickType === 'link',
            datepicker: action._actionType === 'input' && action._inputType === 'datepicker'
          };
          screen._childItems[childIndex]._fontSize = action._fontSize || 12;
          screen._childItems[childIndex]._prefilled = {
            placeholder: action._prefilledType === 'placeholder',
            text: action._prefilledType === 'text'
          };
        });
        self.screens[index] = screen;
      });
      this.model.set('tasks', tasks);
      this.render();
    },

    onUndo: function () {
      var self = this;
      if (self.screenHistory.length > 1) {
        var screenIndex = self.screenHistory.length - 1;
        var nextScreenIndex = screenIndex - 1;
        var screenID = self.screenHistory[nextScreenIndex];
        self.loadScreen({ id: screenID, componentID: this.componentID }, function () {
          self.screenHistory = self.screenHistory.slice(0, -2);
        });
        var firstScreenTask = self.getFirstScreenTask(screenID);
        self.scrollToTask(firstScreenTask);
      }
    },

    onShowInstructions: function (e) {
      var self = this;
      var screen = self.currentViewData.screenView;
      var screenMessage = screen.model.get('body');
      if (screenMessage) {
        Adapt.trigger('simulation-notify:prompt', {
          body: screenMessage,
          _prompts: [
            {
              promptText: "OK"
            }
          ],
          onCloseRefocusEl: $(e.target)
        });
      }
    },

    onExpand: function () {
      if (this.isBrowserFullScreen()) {
        document.exitFullscreen();
      } else {
        this.$el.find('.simulation-wrapper')[0].requestFullscreen();
      }
    },

    listenToFullScreenChange: function () {
      var self = this;
      function handleFullScreenChange(e) {
        if (self.isBrowserFullScreen()) {
          $(e.target).addClass('full-screen-style');
        } else {
          $(e.target).removeClass('full-screen-style');
        }
        self.adjustTaskListWidth();
      }
      document.addEventListener('fullscreenchange', handleFullScreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.addEventListener('mozfullscreenchange', handleFullScreenChange);
      document.addEventListener('MSFullscreenChange', handleFullScreenChange);
    },

    isBrowserFullScreen: function () {
      return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    },

    adjustTaskListWidth: function(){
      var checkboxGroup = this.$el.find('.checkbox-group');
      var checkboxGroupSticky = this.$el.find('.sticky .checkbox-group');
      var label = checkboxGroup.find('div.label span.task-label');
      var taskWidth = checkboxGroup.width();
      var taskWidthSticky = checkboxGroupSticky.width();
      var maxWidthNormal = taskWidth - 35;
      var maxWidthSticky = taskWidthSticky - 35;
      var maxWidth = maxWidthNormal >= 400 ? maxWidthNormal : maxWidthSticky;
      label.css('max-width', maxWidth + 'px');
    },

    listenToResize: function () {
      var element = this.$el.get(0);
      var completionOnMobileView = this.model.get('_setCompletionOnMobile');
      var self = this;

      var resizeObserver = new ResizeObserver(function (entries) {
        for (let entry of entries) {
          if ($(entry.target).width() <= 580 && completionOnMobileView) {
            self.setCompletionStatus();
          }
          self.adjustTaskListWidth();
        }
      });

      resizeObserver.observe(element);
    },

    postRender: function () {
      var self = this;
      this.listenTo(Adapt, 'simulationloadscreen', this.loadScreen);
      this.listenTo(Adapt, 'simulationSuccess', this.onSimulationSuccess);
      this.listenTo(Adapt, 'device:resize', this.adjustTaskListWidth);

      if (this.model.get('active')) {
        var simulation = this.model.get('simulation');
        this.componentID = this.$el.attr('data-adapt-id');

        this.loadImage = function (src) {
          return new Promise((resolve, reject) => {
            const img = this.$el.find(`.simulation-graphic img`)[0]
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          })
        };

        this.loadThumbnail = function (data) {
          if (data.componentID === self.componentID) {
            var filteredScreen = this.screens.filter(function (screen) {
              return screen._screenID === data.id
            });
            var screen = filteredScreen[0];
            var imageSrc = screen._graphic.src;
            this.loadImage(imageSrc).then(function () {
              var fullWidth = screen._graphic._forceFullWidth ? true : false;
              const wrapper = self.$el.find('.simulation-widget');
              wrapper.toggleClass('full-width', fullWidth);
            });
          }
        };

        this.loadScreen = function (data, callback) {
          var self = this;
          if (data.componentID === self.componentID) {
            var filteredScreen = this.screens.filter(function (screen) {
              return screen._screenID === data.id
            });
            var screen = filteredScreen[0];
            if (screen) {
              var imageSrc = screen._graphic.src;
              screen.componentID = this.componentID;
              screen.incorrectFallback = self.model.get('_incorrectFallback');
              if (self.currentViewData && self.currentViewData.screenView) {
                Adapt.trigger('stopkeyboardtrap', { $el: self.$el.find('.action-container').closest('.simulation-widget') });
                self.currentViewData.screenView.remove();
              }
              this.loadImage(imageSrc).then(function () {
                var fullWidth = screen._graphic._forceFullWidth ? true : false;
                const wrapper = self.$el.find('.simulation-widget');
                wrapper.toggleClass('full-width', fullWidth);
                self.currentViewData = {
                  screenID: screen._screenID,
                  screenView: new SimulationScreenView({ model: new Backbone.Model(screen) })
                }

                if (self.$el.find('.action-container')) {
                  var observer = new MutationObserver(function (mutations, me) {
                    var subElement = self.$el.find('.action-container').closest('.simulation-widget');
                    if (subElement.length) {
                      Adapt.trigger('startkeyboardtrap', {focus: screen.focusOnElement, $el: self.$el.find('.action-container').closest('.simulation-widget') });
                      me.disconnect();
                    }
                  });

                  observer.observe(self.$el[0], {
                    childList: true,
                    subtree: true
                  });
                }

                self.screenHistory.push(self.currentViewData.screenID);
                self.$el.find('.simulation-graphic').append(self.currentViewData.screenView.render().el);
                if (callback) callback();
              });
            } else {
              Adapt.trigger('simulation-notify:prompt', {
                title: 'Missing configurations',
                body: '<strong>ERROR: No screen to go to.</strong><p><span class="error-note-simulation">Note to course creator</span> You need to either: select a <em>GoTo</em> screen for this action, set it as the completion event, or set it as a failure event. ',
                _prompts: [
                  {
                    promptText: "OK"
                  }
                ]
              });
            }
          }
        };

        this.getFirstScreenTask = function (screenID) {
          var filteredScreen = this.screens.filter(function (screen) {
            return screen._screenID === screenID
          });
          var screen = filteredScreen[0];
          var firstTask;
          screen._childItems.forEach(function (action, childIndex) {
            if (screen._childItems[childIndex]._isForm) {
              screen._childItems[childIndex]._form.forEach(function (action, formIndex) {
                if (screen._childItems[childIndex]._form[formIndex]._trackAsTask) {
                  if(!firstTask){
                    firstTask = screen._childItems[childIndex]._form[formIndex]
                  }
                };
              });
            }
            if (screen._childItems[childIndex]._trackAsTask) {
              if(!firstTask){
                firstTask = screen._childItems[childIndex]
              }
            };
          });
          return firstTask
        };

        this.setTaskList = function () {
          const taskList = this.$el.find('.simulation-task-list .checkbox-group');
          taskList.each(function () {
            const task = $(this);
            task.removeClass('checked current-task previous-task');
            task.find('input[type="checkbox"]').prop('checked', false);
          });

          const currentStickyTaskWrapper = this.$el.find('.simulation-task-list.current');
          currentStickyTaskWrapper[0].scrollTo({ top: 0 });
          currentStickyTaskWrapper.addClass('sticky');

          const autoTask = this.$el.find('.simulation-task-list .auto-task');
          const autoTaskAria = autoTask.find('.completed-task');
          const firstTask = this.$el.find('.simulation-task-list .first-task');
          const firstTaskLabel = firstTask.find('div.label').text();
          firstTask.addClass('current-task');
          autoTask.addClass('checked');
          autoTask.find('input[type="checkbox"]').prop('checked', true);
          autoTaskAria.text('Completed');
          var currentTaskAria = this.$el.find('.simulation-widget .sr-current-task');
          currentTaskAria.text(`Current Task: ${firstTaskLabel}`);
        };

        this.scrollToTask = function(task){
          const currentStickyTaskWrapper = this.$el.find('.simulation-task-list.current');
          var currentTask = this.$el.find(`.simulation-task-list .checkbox-group[data-task-id="${task.id}"]`);
          var nextTasks = currentTask.nextAll('.checkbox-group');
          currentTask.removeClass('checked previous-task');
          currentTask.addClass('current-task');
          currentTask.find('input[type="checkbox"]').prop('checked', false);
          nextTasks.each(function(){
            const task = $(this);
            task.removeClass('checked current-task previous-task');
            task.find('input[type="checkbox"]').prop('checked', false);
          })
          var offset = currentTask[1].offsetTop;
          setTimeout(function () {
            currentStickyTaskWrapper[0].scrollTo({
              top: offset,
              behavior: 'smooth',
            })
          }, 150);
        }

        this.adjustTaskListWidth();
        var screenID = this.screens[0]._screenID;
        this.loadThumbnail({ id: screenID, componentID: this.componentID });
      }
      this.$('.simulation-widget').imageready(this.setReadyStatus.bind(this));
      if (this.model.get('_setCompletionOn') === 'inview') {
        this.setupInviewCompletion('.component-widget');
      }
    },

    remove: function () {
      if (this.model.get('active')) {
      }
      Backbone.View.prototype.remove.call(this);
    },

    onStartSimulation: function () {
      var self = this;
      self.screenHistory = [];
      var screenID = this.screens[0]._screenID;
      self.setTaskList();
      this.loadScreen({ id: screenID, componentID: this.componentID }, function () {
        self.$el.find('.simulation-toolbar').show();
        self.$el.find('.start-simulation').addClass('display-none');
        self.$el.find('.simulation-graphic').addClass('sticky-margin');
        self.$el.find('.simulation-graphic img').removeClass('simulation-disabled');
      });

    },

    onSimulationSuccess: function (data) {
      if (data.componentID === this.componentID) {
        this.setCompletionStatus();
        this.onStopSimulation();
      }
    },

    onStopSimulation: function () {
      var self = this;
      if (self.isBrowserFullScreen()) {
        document.exitFullscreen();
      }
      var currentTaskAria = this.$el.find('.simulation-widget .sr-current-task');
      currentTaskAria.empty();
      var currentStickyTaskWrapper = this.$el.find('.simulation-task-list.current');
      currentStickyTaskWrapper.removeClass('sticky');
      self.$el.find('.simulation-toolbar').hide();
      if (self.currentViewData && self.currentViewData.screenView) {
        Adapt.trigger('stopkeyboardtrap', { $el: self.$el.find('.action-container').closest('.simulation-widget') });
        self.currentViewData.screenView.remove();
      }
      var screenID = this.screens[0]._screenID;
      this.loadThumbnail({ id: screenID, componentID: this.componentID });
      self.$el.find('.start-simulation').removeClass('display-none');
      self.$el.find('.simulation-graphic').removeClass('sticky-margin');
      self.$el.find('.simulation-graphic img').addClass('simulation-disabled');
      self.$el.find('.start-simulation').focus();
    }

  });

  return SimulationView;

});
