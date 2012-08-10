var enemyWidth = 100 * 0.75;
var enemyHeight = 151 * 0.75;
var enemyHSpacing = enemyWidth;
var enemyVSpacing = 10;

function Enemy (id, game) {
  var world = this.world = game.world;
  this.game = game;

  // Self State
  this.id = id;
  this.score = 100;
  this.fleet = null;
  this.w = enemyWidth;
  this.h = enemyHeight;
  this.state = "alive";

  // Movement State
  this.moveType = "linear"; // Move via smooth linear motion
  this.speed = 200;         // 200px / second

  // DOM State
  this.el = $("<div>");
  this.el.toggleClass("Unit");
  this.el.toggleClass("Enemy");
  this.setSize(this.w, this.h);

  // Add face
  this.face = {};
  this.face.el = $("<div class='Face'>");
  this.el.append(this.face.el);

  // Add body
  var body = $("<div class='Body'>");
  this.el.append(body);

  this.loadUser();
};
Enemy.prototype.loadUser = function(ms) {
  var that = this;
  var user = this.user = this.game.apis.fb.friends[this.id];

  if (user) {
    that.face.el.css("background-image", "url("+user.pic_square+")");
    return;
  }

  FB.api(
    {
      method: 'fql.query',
      query: 'SELECT name, pic_square, uid FROM user WHERE uid='+that.id
    },
    function(response) {
      var user = that.user = response[0];
      that.face.el.css("background-image", "url("+user.pic_square+")");
    }
  );
};
Enemy.prototype.update = function(ms) {
  // Nothing to really do by default...
};
Enemy.prototype.render = function() {
  var now = this.game.time;

  switch (this.state) {
    case "alive":
      break;
    case "dead":
      break;
    case "loading":
      // Show spiny or glowing character without a face?
      break;
  }
};
Enemy.prototype.die = function () {
  if (this.state == "dead") return;
  var now = this.game.time;

  this.state = "dead";
  this.el.remove();

  this.fleet.numAlive--;
  this.fleet.stepInterval *= .9;
  this.game.score += this.score;
};
Enemy.prototype.fire = function () {
  if (this.state == "dead") return;

  this.el.addClass("Fire");
  var that = this;
  setTimeout(function () {
    that.el.removeClass("Fire");
  }, 150);

  var b = new Bullet("Enemy", this.game);
  var x = this.w/2;
  b.fireFrom(this.el, x, this.h);
};
Enemy.prototype.setSize = function (w,h) {
  this.w = w;
  this.h = h;
  this.el.width(w);
  this.el.height(h);
};
Enemy.prototype.moveTo = function(x,y) {
  this.x = x;
  this.y = y;
  this.el.css("top", this.y+"px");
  this.el.css("left", this.x+"px");
};

function Fleet (ids, game) {
  var world = this.world = game.world;
  var now = game.time;
  this.game = game;

  // FB Data
  this.ids = ids;

  // Self State
  this.score = 500;
  this.x = enemyWidth;
  this.y = enemyHeight;
  this.w = (enemyWidth + enemyHSpacing) * 4 - enemyHSpacing;
  this.h = (enemyHeight + enemyVSpacing) * 4 - enemyVSpacing;
  this.state = "alive";

  // Movement State
  this.moveType = "step"; // Move by steps
  this.stepLength = 10;   // 10px wide steps
  this.stepInterval = 500;
  
  this.stepDirection = "right";
  this.lastStep = now;

  // AI
  this.shotInterval = 1000;
  this.lastShot = now;

  // DOM State
  var el = this.el = $("<div>");
  this.el.toggleClass("Group");
  this.el.toggleClass("Fleet");
  this.setSize(this.w, this.h);

  // Construct Fleet
  var ships = this.ships = {};
  this.numAlive = this.ids.length;
  var x = 0; var y = 0;

  for (i in ids) {
    var id = ids[i];

    var guy = ships[id] = world.enemies[id] = new Enemy(id, game);
    guy.fleet = this;
    el.append(guy.el);
    guy.moveTo(x, y);

    if (x + guy.w > this.w - 10) {
      y += enemyHeight + enemyVSpacing;
      x = 0;
    } else {
      x += enemyWidth + enemyHSpacing;
    }

    // Reverse some of them.
    if (Math.random() >= 0.5)
      guy.el.toggleClass("Flipped");
  }

  world.el.append(this.el);
};
Fleet.prototype.update = function(ms) {
  if (this.state == "dead") return;

  // If all our ships die, blow ourselves up
  if (this.numAlive == 0) {
    this.die();
    return;
  }

  // Clear out dead ships
  _.each(this.ships, function (ship, id, ships) {
    if (ship.state == "dead") delete ships[id];
  });

  // Update Position
  var now = this.game.time;
  var since = now - this.lastStep;
  if (since > this.stepInterval) {
    this.lastStep = now;
    this.step();
  }

  // Fire when ready
  since = now - this.lastShot;
  if (since > this.shotInterval) {
    this.lastShot = now;
    this.fire();
  }
};
Fleet.prototype.step = function () {
  var world = this.game.world;

  // Take the appropriate step
  if (this.stepDirection == "right") {
    if ((this.x+this.w+this.stepLength) > world.w) {
      this.stepDown();
      this.stepDirection = "left";
      return;
    }
    this.stepRight();
  } else {
    if ((this.x-this.stepLength) < 0) {
      this.stepDown();
      this.stepDirection = "right";
      return;
    }
    this.stepLeft();
  }
  this.el.toggleClass("Flipped");
};
Fleet.prototype.fire = function () {
  var that = this;
  var timeToFire = Math.random() * 250;

  setTimeout(function () {
    var num = that.numAlive * Math.random();
    num = Math.round(num-0.5) + 1;

    for (var i = 0; i < that.ids.length; i++) {
      var id = that.ids[i];
      var ship = that.ships[id];
      if (!ship) continue;
      if (ship.state == "alive") num--;
      if (!num) { ship.fire(); return; }
    }
  }, timeToFire);
};
Fleet.prototype.render = function() {
  var now = this.game.time;

  switch (this.state) {
    case "alive":
      this.el.css("left", this.x+"px");
      this.el.css("top", this.y+"px");
      break;
    case "dead":
      break;
    case "loading":
      // Show spiny or glowing character without a face?
      break;
  }
};
Fleet.prototype.stepLeft = function () {
  this.x -= this.stepLength;
  this.x = Math.max(this.x, 0);
};
Fleet.prototype.stepRight = function () {
  this.x += this.stepLength;
  this.x = Math.min(this.x, this.world.w-this.w);
};
Fleet.prototype.stepDown = function () {
  this.y += (3 * this.stepLength);
  this.y = Math.min(this.y, this.world.h);
};
Fleet.prototype.setSize = function (w,h) {
  this.w = w;
  this.h = h;
  this.el.width(w);
  this.el.height(h);
};
Fleet.prototype.die = function () {
  this.state = "dead";
  this.el.remove();
  this.game.score += this.score;
};