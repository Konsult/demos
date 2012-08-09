function BalloonButton (label, action) {
  this.state = "alive";
  this.action = action;

  // DOM
  this.el = $("<div class='BalloonButton'>");
  this.el.append(label);
}
