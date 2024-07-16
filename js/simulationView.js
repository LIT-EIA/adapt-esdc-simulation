define([
  'core/js/adapt',
  'core/js/views/componentView',
  './simulationScreenView'
], function (Adapt, ComponentView, SimulationScreenView) {
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

    postRender: function () {
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

        this.loadScreen = function (data) {
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
              if(self.currentViewData && self.currentViewData.screenView){
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
              });
            }
          }
        };
        console.log('after this.screenHistory: ', this.screenHistory);

        var screenID = this.screens[0]._screendID;
        this.loadScreen({ id: screenID, componentID: this.componentID });
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
      console.log('start simulation this: ', this);
      this.$el.find('.exit-simulation-btn').show();
      Adapt.trigger('startkeyboardtrap', { $el: this.$el.find('.action-container')});

      this.$el.parents('.block-inner')[0].scrollIntoView({ block: "end", behavior: "smooth" });
      var self = this;
      setTimeout(function () {
        self.$el.find('.start-simulation').addClass('display-none');
        self.$el.find('.simulation-graphic img').removeClass('simulation-disabled');
      }, 300)
    },

    onStopSimulation: function() {
      console.log('start simulation this: ', this);
      Adapt.trigger('stopkeyboardtrap', { $el: this.$el.find('.action-container') });
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
