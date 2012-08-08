function Bullet (type) {
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
  App.el.append(this.el);

  this.x = this.px = x;
  this.y = this.py = y;
  this.state = "flying";

  this.num = Math.random();
  App.bullets[this.num] = this;
};
Bullet.prototype.update = function (ms) {
  if (this.state === "exploding")
    return;

  var dist = this.speed * (ms / 1000);
  var flip = (this.type == "Enemy") ? 1 : -1;
  dist *= flip;
  this.y += dist;

  if (!App.collides(App.el, this.el)) {
    this.remove();
    return;
  }

  var thingToExplode = null;
  if (this.type == "Player" && App.collides(App.Fleet.el, this.el)) {
    for (i in App.enemies) {
      var e = App.enemies[i];
      if (e.state == "alive" && App.collides(e.el, this.el)) {
        thingToExplode = e;
        break;
      }
    }
  } else if (this.type == "Enemy" && App.collides(App.Player.el, this.el))
    thingToExplode = App.Player;

  if (thingToExplode) {
    thingToExplode.die();
    this.state = "exploding";
    this.el.addClass("Explosion");
    var thingOffset = thingToExplode.el.offset();
    this.el.css({
      top: thingOffset.top + thingToExplode.el.height() / 2,
      left: thingOffset.left + thingToExplode.el.width() / 2,
    });

    var that = this;
    setTimeout(function () { that.remove(); console.log("yay")}, 500);
  }
};
Bullet.prototype.remove = function () {
    App.bullets[this.num] = null;
    this.el.remove();
};

var explosionWidth = 143;
var explosionHeight = 150;

Bullet.prototype.render = function () {
  switch (this.state) {
    case "flying":
      this.el.css("top", this.y+"px");
      break;
    case "exploding":
      var since = App.time - this.explodeTime;
      break;
  }
};
