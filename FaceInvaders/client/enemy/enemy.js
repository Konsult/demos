var enemyWidth = 100 * 0.75;
var enemyHeight = 151 * 0.75;
var enemyHSpacing = enemyWidth;
var enemyVSpacing = 10;

function Enemy (id) {
  // Self State
  this.id = id;
  this.fleet = null;
  this.w = enemyWidth;
  this.h = enemyHeight;
  this.state = "alive";
  this.deadAt = null;

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

  // Load FB Data
  var that = this;
  FB.api(
    {
      method: 'fql.query',
      query: 'SELECT name, pic_square, uid FROM user WHERE uid='+this.id
    },
    function(response) {
      var user = response[0];
      that.pic = user.pic_square;
      that.name = user.name;
      that.face.el.css("background-image", "url("+that.pic+")");
    }
  );

  // Add body
  var body = $("<div class='Body'>");
  this.el.append(body);
};
Enemy.prototype.update = function(ms) {
  // Nothing to really do by default...
};
Enemy.prototype.render = function() {
  switch (this.state) {
    case "alive":
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
Enemy.prototype.die = function () {
  this.state = "dead";
  this.deadAt = App.time;
  this.el.addClass("dead");
  this.fleet.numAlive--;
};
Enemy.prototype.fire = function () {
  this.el.addClass("Fire");
  var that = this;
  setTimeout(function () {
    that.el.removeClass("Fire");
  }, 150);

  var b = new Bullet("Enemy");
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

function Fleet (ids) {
  // FB Data
  this.ids = ids;

  // Self State
  this.x = enemyWidth;
  this.y = enemyHeight;
  this.w = (enemyWidth + enemyHSpacing) * 6 - enemyHSpacing;
  this.h = (enemyHeight + enemyVSpacing) * 6 - enemyVSpacing;
  this.state = "alive";
  this.deadAt = null;

  // Movement State
  this.moveType = "step"; // Move by steps
  this.stepLength = 10;   // 10px wide steps
  this.stepInterval = 500;
  this.stepDirection = "right";
  this.lastStep = App.time;

  // AI
  this.shotInterval = 1000;
  this.lastShot = App.time;

  // DOM State
  var el = this.el = $("<div>");
  this.el.toggleClass("Group");
  this.el.toggleClass("Fleet");
  this.setSize(this.w, this.h);

  // Construct Fleet
  var guys = this.guys = {};
  var x = 0;
  var y = 0;

  for (i in ids) {
    var id = ids[i];

    var guy = guys[id] = App.enemies[id] = new Enemy(id);
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

  this.numAlive = this.ids.length;
  App.el.append(this.el);
};
Fleet.prototype.update = function(ms) {
  if (this.state == "dead") return;

  // If all our guys die, blow ourselves up
  if (this.numAlive == 0) {
    this.die();
    return;
  }

  // Fire from a random guy at regular interval
  var since = App.time - this.lastShot;
  if (since > this.shotInterval) {
    var timeToFire = Math.random() * 250;
    this.lastShot = App.time;

    var that = this;
    setTimeout(function () {
      var num = that.numAlive * Math.random();
      num = Math.round(num-0.5);

      for (var i = 0; i < that.ids.length; i++) {
        var id = that.ids[i];
        if (!num) {
          that.guys[id].fire();
          return;
        }
        if (that.guys[id].state == "alive") num--;
      }
    }, timeToFire);
  }

  // Compute time since last step
  since = App.time - this.lastStep;
  if (since < this.stepInterval) return;
  this.lastStep = App.time;

  // Take the appropriate step
  if (this.stepDirection == "right") {
    if ((this.x+this.w+this.stepLength) > App.w) {
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
Fleet.prototype.render = function() {
  switch (this.state) {
    case "alive":
      this.el.css("left", this.x+"px");
      this.el.css("top", this.y+"px");
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
Fleet.prototype.stepLeft = function () {
  this.x -= this.stepLength;
  this.x = Math.max(this.x, 0);
};
Fleet.prototype.stepRight = function () {
  this.x += this.stepLength;
  this.x = Math.min(this.x, App.w-this.w);
};
Fleet.prototype.stepDown = function () {
  this.y += (3 * this.stepLength);
  this.y = Math.min(this.y, App.h);
};
Fleet.prototype.setSize = function (w,h) {
  this.w = w;
  this.h = h;
  this.el.width(w);
  this.el.height(h);
};
Fleet.prototype.die = function () {
  this.state = "dead";
  this.deadAt = App.time;
  this.el.toggleClass("dead"); 
};