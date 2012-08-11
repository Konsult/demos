function BalloonButton (label, onhit) {
  this.state = "alive";
  this.onhit = onhit;

  // DOM
  this.el = $("<div id='LoginBalloon' class='BalloonButton'>");
  this.el.append(label);
}
BalloonButton.prototype.takeHit = function() {
  this.onhit();
  this.die();
  return true;
};
BalloonButton.prototype.die = function() {
  this.state = "dead";
  this.el.remove();
};

function LoginBalloon (api, world) {
  var msg = "Log In to Facebook";
  var tooltip = new Tooltip("Shoot this to begin");
  var onhit = function () {
    api.login();
    tooltip.el.remove();
  };
  var that = new BalloonButton(msg, onhit);

  world.el.append(that.el);
  world.el.append(tooltip.el);

  var offset = {
    left: (world.w - that.el.outerWidth(true)) / 2,
    top: (world.h - that.el.outerHeight(true)) / 2,
  };
  that.el.offset(offset);

  tooltip.el.offset({
    top: offset.top - tooltip.el.outerHeight(true),
    left: world.w / 2,
  });

  return that;
};