function BalloonButton (label, action) {
  this.state = "alive";
  this.action = action;

  // DOM
  this.el = $("<div id='LoginBalloon' class='BalloonButton'>");
  this.el.append(label);
}
BalloonButton.prototype.die = function() {
  this.state = "dead";
  this.el.remove();
  this.action();
};
