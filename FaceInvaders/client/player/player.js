var regularPlayerWidth = 138;
var regularPlayerHeight = 103;
var birthdayPlayerWidth = 159;
var birthdayPlayerHeight = 198;

function Player (game) {
  var world = this.world = game.world;
  this.game = game;

  // User Data
  this.id = this.name = null;
  this.friends = null;

  // Self State
  if ($(".Birthday").length) {
    this.w = birthdayPlayerWidth;
    this.h = birthdayPlayerHeight;
  } else {
    this.w = regularPlayerWidth;
    this.h = regularPlayerHeight;    
  }
  this.x = this.tx = (this.world.w / 2 - this.w / 2);
  this.state = "alive";
  this.deadAt = null;
  this.lives = 5;

  // Shooting
  this.shotInterval = 1000;
  this.readyToShoot = true;

  // Movement State
  this.moveType = "linear"; // Move via smooth linear motion
  this.speed = 200;         // 200px / second
  this.stepLength = 100;    // 100px wide steps
  this.lastStep = game.time; // Timestamp of last step
  this.stepInterval = 250;  // in ms

  // DOM State
  this.el = $("<div>");
  this.el.addClass("Unit Player Ready");
  this.el.width(this.w);
  this.el.height(this.h);

  // Add Face
  this.face = {};
  this.face.el = $("<div class='Face'>");
  this.el.append(this.face.el);

  // Add body
  this.el.append("<div class='Body'>");

  // Add wheels
  var wheelContainer = $("<div class='WheelContainer'>");
  for (var i = 0; i < 2; i++)
    wheelContainer.append($("<div class='wheel'>"));
  this.el.append(wheelContainer);

  world.el.append(this.el);
};
Player.prototype.load = function () {
  this.id = FB.getUserID();
  this.state = "loading";

  // Load User Info from Facebook
  var that = this;
  FB.api(
    {
      method: 'fql.query',
      query: 'SELECT name, pic_square FROM user WHERE uid='+this.id
    },
    function(response) {
      var user = response[0];
      that.pic = user.pic_square;
      that.name = user.name;
      that.state = "alive";

      that.face.el.css("background-image", "url("+that.pic+")");
    }
  );
};
Player.prototype.update = function (ms) {
  if (this.x == this.tx)  {
    this.el.removeClass("Move");
    return;
  }

  var need = this.tx - this.x;
  var disp = this.speed * (ms / 1000);
  var perc = Math.abs(disp / need);
  perc = Math.min(perc, 1);
  this.x += perc * need;

  // TODO: Move wheel rendering logic elsewhere
  if (need > 0) {
    this.el.css({"-webkit-transform": "rotateY(180deg)"});
    this.el.addClass("Move");
  } else {
    this.el.css({"-webkit-transform": ""});
    this.el.addClass("Move");
  }
};
Player.prototype.render = function () {
  var now = this.game.time;

  switch (this.state) {
    case "alive":
      this.el.css("left", this.x+"px");
      break;
    case "dead":
      var since = now - this.deadAt;
      if (since > 2000)
        this.el.css("display", "none");
      break;
    case "loading":
      // Show spiny or glowing character without a face?
      break;
  }
};
Player.prototype.fire = function () {
  var now = this.game.time;

  if (this.state != "alive") return;
  if (!this.readyToShoot) return;

  this.readyToShoot = false;
  this.el.removeClass("Ready");

  var el = this.el;
  el.addClass("Fire");
  setTimeout(function () {
    el.removeClass("Fire");
  }, 150);

  var b = new Bullet("Player", this.game);
  var x = this.w/2;
  b.fireFrom(this.el, x, 0);

  var that = this;
  setTimeout(function () {
    that.readyToShoot = true;
    that.el.addClass("Ready");
  }, this.shotInterval);
};
Player.prototype.goto = function (x) {
  this.tx = x - this.w / 2;
};
Player.prototype.stepLeft = function () {
  var now = this.game.time;

  if (this.tx > this.x) {
    this.tx = this.x;
    return;
  }

  var since = now - this.lastStep;
  if (since < this.stepInterval) return;
  this.lastStep = now;

  var tx = this.tx - this.stepLength;
  this.tx = Math.max(tx, 0);
};
Player.prototype.stepRight = function () {
  var now = this.game.time;

  if (this.tx < this.x) {
    this.tx = this.x;
    return;
  }

  var since = now - this.lastStep;
  if (since < this.stepInterval) return;
  this.lastStep = now;

  var tx = this.tx + this.stepLength;
  var max = this.world.w - this.w;
  this.tx = Math.min(tx, max);
};
Player.prototype.die = function () {
  var now = this.game.time;

  this.state = "dead";
  this.deadAt = now;
  this.el.addClass("dead");
};
Player.prototype.takeHit = function (thing) {
  var off = this.el.offset();
  var x = off.left + this.w/2;
  var y = off.top + this.h/2;
  this.game.effects.createExplosion(x,y);

  if (--this.lives == 0) this.die();
  else {
    // TODO: Stop moving, show explosion or flash, then fade back
    // in and add immunity for a few seconds to dodge bullets
  }
  return true;
};
