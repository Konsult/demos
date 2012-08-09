// Requires: jQuery, Underscore, Meteor.http

Meteor.startup(function () {
  var el = $(document.body);
  App.launch(el);
  App.loadFacebook();
});
