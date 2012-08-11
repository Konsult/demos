function Effects (game) {
  this.game = game;
  // Add Effects Layer to World?
  // Handle all complex animation states
};
Effects.prototype.createExplosion = function (x, y) {
  var game = this.game;
  var duration = 500;

  var el = $("<div>").addClass("Explosion").appendTo(game.el);
  el.css("left", x+"px").css("top", y+"px");

  setTimeout(function () {
    el.remove();
  }, duration);
};