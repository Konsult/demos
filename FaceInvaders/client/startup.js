// Requires: jQuery, Underscore, Meteor.http

Meteor.startup(function () {
  var el = $(document.body);
  window.app = new Game(el);
});
