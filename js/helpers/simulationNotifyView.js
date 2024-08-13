define([
  'core/js/adapt',
  'core/js/views/notifyView'
], function (Adapt, NotifyView) {
  
  var SimulationNotifyView = NotifyView.extend({
    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates.notify;

      //hide notify container
      this.$el.css('visibility', 'hidden');
      //attach popup + shadow
      if ($('.simulation-wrapper.full-screen-style').length > 0) {
        this.$el.html(template(data)).prependTo('.simulation-wrapper.full-screen-style .simulation-notify-area');
      }
      else {
        this.$el.html(template(data)).prependTo('body');
      }
      //hide popup
      this.$('.notify-popup').css('visibility', 'hidden');
      //show notify container
      this.$el.css('visibility', 'visible');

      this.showNotify();
      return this;
    },
    onCloseReady: function () {
      if (this.disableAnimation) {

        this.$('.notify-popup').css('visibility', 'hidden');
        this.$el.css('visibility', 'hidden');

        this.remove();

      } else {

        this.$('.notify-popup').velocity({ opacity: 0 }, {
          duration: 400, complete: function () {
            this.$('.notify-popup').css('visibility', 'hidden');
          }.bind(this)
        });

        this.$('.notify-shadow').velocity({ opacity: 0 }, {
          duration: 400, complete: function () {
            this.$el.css('visibility', 'hidden');
            this.remove();
          }.bind(this)
        });
      }

      Adapt.a11y.scrollEnable('body');
      $('html').removeClass('notify');

      // Return focus to previous active element
      Adapt.a11y.popupClosed(this.$previousActiveElement);

      // Return reference to the notify view
      Adapt.trigger('notify:closed', this);
      if (this.model && this.model.get('onCloseRefocusEl')) {
        this.model.get('onCloseRefocusEl').focus();
      }
    },
  });

  return SimulationNotifyView;

});