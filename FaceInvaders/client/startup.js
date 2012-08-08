Meteor.startup(function () {
  var el = $(document.body);
  App.launch(el);
  App.loadFacebook();
});
