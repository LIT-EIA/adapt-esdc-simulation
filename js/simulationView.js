define([
  'core/js/adapt',
  'core/js/views/componentView'
], function (Adapt, ComponentView) {
  'use strict';

  var SimulationView = ComponentView.extend({

    events: {
      'click .start-simulation': 'onStartSimulation'
    },

    initialize: function () {
      ComponentView.prototype.initialize.call(this);
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

        this.loadScreen = function(id){
          var filteredScreen = this.screens.filter(function(screen){
            return screen._screendID === id
          });
          var screen = filteredScreen[0];
          var imageSrc = screen._graphic.src;
          this.loadImage(imageSrc).then(function(){
            screen._childItems.forEach(function(action){
              console.log(action);
            })
          });
        };

        var screenID = this.screens[0]._screendID;
        this.loadScreen(screenID);
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
      this.$el.parents('.block-inner')[0].scrollIntoView({ block: "end", behavior: "smooth" });
      var self = this;
      setTimeout(function () {
        self.$el.find('.start-simulation').addClass('display-none');
        self.$el.find('.simulation-graphic img').removeClass('simulation-disabled');
      }, 300)
    }

  });

  return SimulationView;

});
