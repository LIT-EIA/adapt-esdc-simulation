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
    }
  });

  return SimulationNotifyView;

});