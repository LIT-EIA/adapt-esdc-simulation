define([
  'core/js/adapt',
  'core/js/views/componentView',
  './simulationScreenView',
  'core/js/views/notifyView'
], function (Adapt, ComponentView, SimulationScreenView, NotifyView) {
  'use strict';

  var SimulationView = ComponentView.extend({

    events: {
      'click .start-simulation': 'onStartSimulation',
      'click .exit-simulation-btn': 'onStopSimulation'
    },

    initialize: function () {
      ComponentView.prototype.initialize.call(this);
      this.screenHistory = [];
      this.currentViewData;
      this.listenToFullScreenChange();
      this.checkIfResetOnRevisit();
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
      this.render();
    },

    listenToFullScreenChange: function () {
      var self = this;
      function handleFullScreenChange() {
        if (self.isBrowserFullScreen()) {
          self.$el.find('.simulation-widget').addClass('full-screen-style');
        } else {
          self.$el.find('.simulation-widget').removeClass('full-screen-style');
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

    postRender: function () {
      var DerivedView = NotifyView.extend({
        render: function() {
            NotifyView.prototype.render.apply(this);
        }
    });
      //var notifyView = new DerivedView({ model: new Backbone.Model({_classes: 'display-none'}) });
      var self = this;
      this.listenTo(Adapt, 'simulationloadscreen', this.loadScreen);
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
              return screen._screendID === data.id
            });
            var screen = filteredScreen[0];
            console.log('screen: ', screen);
            var imageSrc = screen._graphic.src;
            this.loadImage(imageSrc).then(function () {
              console.log('loaded');
            });
          }
        };

        this.loadScreen = function (data, callback) {
          if (data.componentID === self.componentID) {
            var filteredScreen = this.screens.filter(function (screen) {
              return screen._screendID === data.id
            });
            var screen = filteredScreen[0];
            console.log('screen: ', screen);
            var imageSrc = screen._graphic.src;
            screen.componentID = this.componentID;
            screen.incorrectFallback = self.model.get('_incorrectFallback');
            if (screen) {
              if (self.currentViewData && self.currentViewData.screenView) {
                Adapt.trigger('stopkeyboardtrap', { $el: self.$el.find('.action-container') });
                self.currentViewData.screenView.remove();
              }
              this.loadImage(imageSrc).then(function () {
                self.currentViewData = {
                  screenID: screen._screendID,
                  screenView: new SimulationScreenView({ model: new Backbone.Model(screen) })
                }
                self.screenHistory.push(self.currentViewData.screenID);
                console.log(self.currentViewData.screenView);
                self.$el.find('.simulation-graphic').append(self.currentViewData.screenView.render().el);
                Adapt.trigger('startkeyboardtrap', { $el: self.$el.find('.action-container') });
                if (callback) callback();
              });
            }
          }
        };
        console.log('after this.screenHistory: ', this.screenHistory);
        var screenID = this.screens[0]._screendID;
        this.loadThumbnail({ id: screenID, componentID: this.componentID })
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
      console.log('start simulation this: ', this);
      var screenID = this.screens[0]._screendID;
      this.loadScreen({ id: screenID, componentID: this.componentID }, function () {
        self.$el.find('.exit-simulation-btn').show();
        self.$el.parents('.block-inner')[0].scrollIntoView({ block: "end", behavior: "smooth" });
        setTimeout(function () {
          self.$el.find('.start-simulation').addClass('display-none');
          self.$el.find('.simulation-graphic img').removeClass('simulation-disabled');
        }, 300)
      });

    },

    onStopSimulation: function () {
      console.log('start simulation this: ', this);
      this.$el.find('.exit-simulation-btn').hide();
      var self = this;
      setTimeout(function () {
        self.$el.find('.start-simulation').removeClass('display-none');
        self.$el.find('.simulation-graphic img').addClass('simulation-disabled');
      }, 300)
    }

  });

  return SimulationView;

});
