function Bullet (type, game) {
  var world = this.world = game.world;
  this.game = game;

  // Self State
  this.type = type;
  // this.state = "unfired";
  this.deadAt = null;

  // Movement State
  this.moveType = "linear"; // Move via smooth linear motion
  this.speed = 500; // 200px / second

  // DOM State
  this.el = $("<div>");
  this.el.toggleClass("Bullet");
  this.el.toggleClass(type+"Bullet");
};
Bullet.prototype.fireFrom = function (el, x, y) {
  var off = el.offset();
  var x = off.left + x - (this.el.width() / 2);
  var y = off.top + y - (this.el.height() / 2);

  this.el.css("top", y+"px");
  this.el.css("left", x+"px");
  this.world.el.append(this.el);

  this.x = this.px = x;
  this.y = this.py = y;
  this.state = "flying";

  this.num = Math.random();
  this.world.bullets[this.num] = this;
};
Bullet.prototype.update = function (ms) {
  var that = this;
  var game = this.game;
  var world = this.world;

  if (this.state === "exploding") return;

  var dist = this.speed * (ms / 1000);
  var flip = (this.type == "Enemy") ? 1 : -1;
  dist *= flip;
  this.y += dist;

  if (!game.collides(world, this)) {
    this.remove();
    return;
  }

  var hit = null;
  switch (this.type) {
    case "Player":
      if (world.fleet && game.collides(world.fleet, this)) {
        var enemies = world.fleet.ships;
        hit = _.find(enemies, function (e) {
          return (e.state == "alive" && game.collides(e, that));
        });
      }
      if (game.balloon && game.collides(game.balloon, that))
        hit = game.balloon;
      break;
    case "Enemy":
      if (game.collides(game.player, that))
        hit = game.player;
      break;
  }

  if (hit) {
    this.state = "exploding";
    this.el.addClass("Explosion");
    var thingOffset = hit.el.offset();
    this.el.css({
      top: thingOffset.top + hit.el.height() / 2,
      left: thingOffset.left + hit.el.width() / 2,
    });

    setTimeout(function () { that.remove(); console.log("yay")}, 500);
    hit.die();
  }
};
Bullet.prototype.remove = function () {
  var world = this.world;
  world.bullets[this.num] = null;
  this.el.remove();
};

var explosionWidth = 143;
var explosionHeight = 150;

Bullet.prototype.render = function () {
  var now = this.game.time;

  switch (this.state) {
    case "flying":
      this.el.css("top", this.y+"px");
      break;
    case "exploding":
      var since = now - this.explodeTime;
      break;
  }
};
