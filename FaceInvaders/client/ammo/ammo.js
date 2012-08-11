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
  var game = this.game;
  var world = this.world;

  if (this.state === "exploding") return;

  var dist = this.speed * (ms / 1000);
  var flip = (this.type == "Enemy") ? 1 : -1;
  dist *= flip;
  this.y += dist;

  if (!game.collides(world, this)) {
    this.die();
    return;
  }

  var didhit = false;
  var that = this;
  switch (this.type) {
    case "Player":
      didhit = _.find(world.enemies, function (e) {
        return game.collides(e, that) && e.takeHit(that);
      });
      break;
    case "Enemy":
      var player = game.player;
      didhit = game.collides(player, this) && player.takeHit(this);
      break;
  }
  didhit && this.die();
};
Bullet.prototype.die = function () {
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
