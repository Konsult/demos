function Player () {
  // User Data
  this.id = this.name = null;
  this.friends = null;

  // Self State
  this.w = 100; this.h = 95;
  this.x = this.tx = (App.w / 2 - this.w / 2);
  this.state = "alive";
  this.deadAt = null;
  this.lives = 5;

  // Shooting
  this.shotInterval = 1000;
  this.lastShot = App.time;

  // Movement State
  this.moveType = "linear"; // Move via smooth linear motion
  this.speed = 200;         // 200px / second
  this.stepLength = 100;    // 100px wide steps
  this.lastStep = App.time; // Timestamp of last step
  this.stepInterval = 250;  // in ms

  // DOM State
  this.el = $("<div>");
  this.el.toggleClass("Unit");
  this.el.toggleClass("Player");
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
  for (var i = 0; i < 5; i++)
    wheelContainer.append($("<div class='wheel'>"));
  this.el.append(wheelContainer);

  App.el.append(this.el);
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
    this.el.removeClass("Left Right");
    return;
  }

  var need = this.tx - this.x;
  var disp = this.speed * (ms / 1000);
  var perc = Math.abs(disp / need);
  perc = Math.min(perc, 1);
  this.x += perc * need;

  if (need > 0)
    this.el.removeClass("Left").addClass("Right");
  else
    this.el.removeClass("Right").addClass("Left");
};
Player.prototype.render = function () {
  switch (this.state) {
    case "alive":
      this.el.css("left", this.x+"px");
      break;
    case "dead":
      var since = App.time - this.deadAt;
      if (since > 2000)
        this.el.css("display", "none");
      break;
    case "loading":
      // Show spiny or glowing character without a face?
      break;
  }
};
Player.prototype.fire = function () {
  if (this.state != "alive") return;

  var since = App.time - this.lastShot;
  if (since < this.shotInterval) return;
  this.lastShot = App.time;

  var el = this.el;
  el.addClass("Fire");
  setTimeout(function () {
    el.removeClass("Fire");
  }, 150);

  var b = new Bullet("Player");
  var x = this.w/2 - 10;
  b.fireFrom(this.el, x, 0);
};
Player.prototype.goto = function (x) {
  this.tx = x - this.w / 2;
};
Player.prototype.stepLeft = function () {
  if (this.tx > this.x) {
    this.tx = this.x;
    return;
  }

  var since = App.time - this.lastStep;
  if (since < this.stepInterval) return;
  this.lastStep = App.time;

  var tx = this.tx - this.stepLength;
  this.tx = Math.max(tx, 0);
};
Player.prototype.stepRight = function () {
  if (this.tx < this.x) {
    this.tx = this.x;
    return;
  }

  var since = App.time - this.lastStep;
  if (since < this.stepInterval) return;
  this.lastStep = App.time;

  var tx = this.tx + this.stepLength;
  var max = App.w - this.w;
  this.tx = Math.min(tx, max);
};
Player.prototype.die = function () {
  if (--this.lives == 0) {
    this.state = "dead";
    this.deadAt = App.time;
    this.el.addClass("dead");
  } else {
    // TODO: Stop moving, show explosion or flash, then fade back
    // in and add immunity for a few seconds to dodge bullets
  }
};
