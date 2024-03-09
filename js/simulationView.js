define([
  'core/js/adapt',
  'core/js/views/componentView'
], function (Adapt, ComponentView) {
  'use strict';

  var SimulationView = ComponentView.extend({

    events: {
      'click .start-tour': 'onStartTour'
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
      this.steps = this.model.get('_items');
      if (this.steps && this.steps.length >= 2) {
        this.model.set('active', true);
        this.steps.forEach(function (step) {
          var img = new Image();
          img.src = step._graphic.src;
        });
        const globals = Adapt.course.get('_globals');
        var simulation = globals._components._simulation;
        this.model.set('simulation', simulation);
      }
      this.render();
    },

    postRender: function () {
      if (this.model.get('active')) {
        var simulation = this.model.get('simulation');
        this.componentID = this.$el.attr('data-adapt-id');

        this.tour = new Shepherd.Tour({
          defaultStepOptions: {
            cancelIcon: {
              enabled: true
            },
            scrollTo: false
          }
        });


        this.verifyCompletion = function () {
          if (Object.values(this.steps).every(step => step.inView === true)) {
            this.setCompletionStatus();
          }
        }

        this.previousStep = function (self, stepIndex) {
          var step = this.steps[stepIndex];
          this.loadImage(step._graphic.src).then(() =>
            self.back()
          );
        };

        this.nextStep = function (self, stepIndex) {
          this.steps[stepIndex].inView = true;
          var step = this.steps[stepIndex];
          this.loadImage(step._graphic.src).then(() =>
            self.next()
          );
        };

        this.loadImage = function (src) {
          return new Promise((resolve, reject) => {
            const img = this.$el.find(`.simulation-graphic img`)[0]
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          })
        };

        var self = this;

        this.tour.on('cancel', function (e) {
          self.loadImage(self.steps[0]._graphic.src).then(() => {
            self.$el.find('.simulation-graphic img').addClass('tour-disabled');
            self.$el.find('.start-tour').removeClass('display-none');
            self.verifyCompletion();
          })
        });

        this.steps.forEach(function (step, index) {
          var stepObject = {
            title: step.title,
            text: step.body,
            buttons: [
              {
                action() {
                  return index === 0 ? self.tour.cancel() : self.previousStep(this, (index - 1));
                },
                classes: 'shepherd-button-secondary',
                text: index === 0 ? simulation.closeText : simulation.previousText
              },
              {
                action() {
                  return index === (self.steps.length - 1) ? self.tour.cancel() : self.nextStep(this, (index + 1));
                },
                text: index === (self.steps.length - 1) ? simulation.closeText : simulation.nextText
              }
            ],
            id: `step-${index}-${self.componentID}`,
            attachTo: {
              element: `div[data-adapt-id="${self.componentID}"] .tour-item-${index}`,
              on: step._pin._bubbledirection !== 'none' ? step._pin._bubbledirection : 'bottom'
            },
            arrow: step._pin._bubbledirection !== 'none'
          }
          self.tour.addStep(stepObject);
        })
      }
      this.$('.simulation-widget').imageready(this.setReadyStatus.bind(this));
      if (this.model.get('_setCompletionOn') === 'inview') {
        this.setupInviewCompletion('.component-widget');
      }
    },

    remove: function () {
      if (this.model.get('active')) {
        this.tour.complete();
      }
      Backbone.View.prototype.remove.call(this);
    },

    onStartTour: function () {
      this.$el.parents('.block-inner')[0].scrollIntoView({ block: "end", behavior: "smooth" });
      this.steps[0].inView = true;
      var self = this;
      setTimeout(function () {
        self.$el.find('.start-tour').addClass('display-none');
        self.$el.find('.simulation-graphic img').removeClass('tour-disabled');
        self.tour.start();
      }, 300)
    }

  });

  return SimulationView;

});
