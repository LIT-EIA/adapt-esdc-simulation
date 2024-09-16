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
      this.screens = this.model.get('_items');
      this.model.set('active', true);
      const globals = Adapt.course.get('_globals');
      var simulation = globals._components._simulation;
      this.model.set('simulation', simulation);
      console.log(this.screens);
      var tasks = this.screens.flatMap(screen =>
        screen._childItems.flatMap(item =>
          (item._isForm ? item._form : [item])
          .filter(subItem => subItem._trackAsTask)
        )
      );
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
          onCloseRefocusEl: $(e.target).parent()
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

    listenToResize: function () {
      var element = this.$el.get(0);
      var completionOnMobileView = this.model.get('_setCompletionOnMobile');
      var self = this;

      var resizeObserver = new ResizeObserver(function (entries) {
        for (let entry of entries) {
          if ($(entry.target).width() <= 580 && completionOnMobileView) {
            self.setCompletionStatus();
          }
        }
      });

      resizeObserver.observe(element);
    },

    postRender: function () {
      var self = this;
      this.listenTo(Adapt, 'simulationloadscreen', this.loadScreen);
      this.listenTo(Adapt, 'simulationSuccess', this.onSimulationSuccess);
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
            //console.log('screen: ', screen);
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
                      Adapt.trigger('startkeyboardtrap', { $el: self.$el.find('.action-container').closest('.simulation-widget') });
                      me.disconnect();
                    }
                  });

                  observer.observe(self.$el[0], {
                    childList: true,
                    subtree: true
                  });
                }

                self.screenHistory.push(self.currentViewData.screenID);
                //console.log(self.currentViewData.screenView);
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
        //console.log('after this.screenHistory: ', this.screenHistory);
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
      //console.log('start simulation this: ', this);
      var screenID = this.screens[0]._screenID;
      this.loadScreen({ id: screenID, componentID: this.componentID }, function () {
        self.$el.find('.simulation-toolbar').show();
        self.$el.find('.start-simulation').addClass('display-none');
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
      self.$el.find('.simulation-toolbar').hide();
      if (self.currentViewData && self.currentViewData.screenView) {
        Adapt.trigger('stopkeyboardtrap', { $el: self.$el.find('.action-container').closest('.simulation-widget') });
        self.currentViewData.screenView.remove();
      }
      var screenID = this.screens[0]._screenID;
      this.loadThumbnail({ id: screenID, componentID: this.componentID });
      self.$el.find('.start-simulation').removeClass('display-none');
      self.$el.find('.simulation-graphic img').addClass('simulation-disabled');
    }

  });

  return SimulationView;

});
