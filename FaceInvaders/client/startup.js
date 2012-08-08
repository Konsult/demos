Meteor.startup(function () {
  var el = $(document.body);
  App.launch(el);
  App.loadFacebook();
});

var App = {
  raf: null,
  time: (new Date()).getTime(),

  Player: null,
  Fleet: null,
  enemies: {},
  bullets: {},

  el: null,
  w: 1440, h: 900,

  loggedIn: false,
  fbLoaded: false,
  gameInProgress: false,
  loadFacebook: function () {
    window.fbAsyncInit = function() {
      FB.init({
        appId      : '485761404769776', // App ID
        // channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel File
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
      });
      App.fbLoaded = true;

      function onStatus(response) {
        if (response.status === 'connected') {
          App.loggedIn = true;
          App.Player.load();
        } else App.loggedIn = false;
      };

      FB.getLoginStatus(function(response) {
        onStatus(response); // once on page load
        FB.Event.subscribe('auth.statusChange', onStatus); // every status change
      });
    };

    // Load the SDK Asynchronously
    (function(d) {
      console.log("Async Loading Facebook API SDK");
      var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement('script'); js.id = id; js.async = true;
      js.src = "//connect.facebook.net/en_US/all.js";
      ref.parentNode.insertBefore(js, ref);
    }(document));
  },
  login: function () {
    FB.login();
  },
  logout: function () {
    FB.logout();
  },
  launch: function (pel) {
    // Set up DOM
    var el = App.el = $("<div>");
    el.toggleClass("App");
    pel.append(el);

    // Fit the viewport
    function resizeToViewport() {
      App.w = $(window).width();
      App.h = $(window).height();
      el.width(App.w);
      el.height(App.h);
    }
    $(window).resize(resizeToViewport);
    resizeToViewport();

    // Set up inputs
    var doc = $(document);
    doc.keydown(function (e) {
      console.log(e.which);

      if (e.which == 32 && App.Player)
        App.Player.fire();
      if (e.which == 37 && App.Player)
        App.Player.stepLeft();
      if (e.which == 39 && App.Player)
        App.Player.stepRight();
    });
    doc.click(function () {
      if (App.fbLoaded && !App.loggedIn) {
        App.login();
      } else if (App.loggedIn && !App.gameInProgress) {
        App.loadGame(0);
      }
    });

    App.Player = new Player();
    App.main();
  },
  loadGame: function (gameID) {
    switch (gameID) {
      default:
        App.loadMap(0);
        App.createFriendFleet();
        break;
    }
    App.gameInProgress = true;
  },
  loadMap: function (mapID) {
  },
  createFriendFleet: function () {
    var base = "https://graph.facebook.com";
    var path = "/me/friends";
    var query = "?access_token=" + FB.getAccessToken();
    var url = base + path + query;

    Meteor.http.get(url, function (e, r) {
      if (e) { console.log("ERROR: Get FB Friends Failed."); return;}
      var friends = JSON.parse(r.content).data;
      App.Fleet = new Fleet(friends, 10);
    });
  },
  main: function () {
    App.raf = window.requestAnimationFrame(App.main);

    var now = (new Date()).getTime();
    var ms = now - App.time;
    App.time = now;

    App.update(ms);
    App.render();
  },
  update: function (ms) {
    App.Player && App.Player.update(ms);
    App.Fleet && App.Fleet.update(ms);

    function updateAll (L) {
      for (i in L) {
        var o = L[i];
        o && o.update(ms);
      }
    };
    updateAll(App.bullets);
  },
  render: function () {
    App.Player && App.Player.render();
    App.Fleet && App.Fleet.render();

    function renderAll (L) {
      for (i in L) {
        var o = L[i];
        o && o.render();
      }
    };
    renderAll(App.bullets);
  },
  collides: function (a, b) {
    // Currently assumes only DOM nodes' rects for collisions
    function left (x) { return x.offset().left };
    function right (x) { return left(x) + x.width(); };
    function top (x) { return x.offset().top; };
    function bottom (x) { return top(x) + x.height(); };

    return !(left(a) > right(b)
          || right(a) < left(b)
          || top(a) > bottom(b)
          || bottom(a) < top(b));
  }
};

function Player () {
  // User Data
  this.id = this.name = null;
  this.friends = null;

  // Self State
  this.x = this.tx = 0;
  this.w = 100; this.h = 95;
  this.state = "alive";
  this.deadAt = null;

  // Movement State
  this.moveType = "linear"; // Move via smooth linear motion
  this.speed = 200;         // 200px / second
  this.stepLength = 100;    // 100px wide steps

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
  this.el.addClass("Fire");
  var that = this;
  setTimeout(function () {
    that.el.removeClass("Fire");
  }, 150);

  var b = new Bullet("Player");
  var x = this.w/2 - 10;
  b.fireFrom(this.el, x, 0);
  console.log("Player fires!");
};
Player.prototype.stepLeft = function () {
  if (this.tx > this.x) {
    this.tx = this.x;
    return;
  }

  var tx = this.tx - this.stepLength;
  this.tx = Math.max(tx, 0);

  this.el.addClass("Left");
  this.el.removeClass("Right");
};
Player.prototype.stepRight = function () {
  if (this.tx < this.x) {
    this.tx = this.x;
    return;
  }

  var tx = this.tx + this.stepLength;
  var max = App.w - this.w;
  this.tx = Math.min(tx, max);

  this.el.addClass("Right");
  this.el.removeClass("Left");
};
Player.prototype.die = function () {
  this.state = "dead";
  this.deadAt = App.time;
  this.el.toggleClass("dead");
};

var enemyWidth = 100 * 0.75;
var enemyHeight = 151 * 0.75;
var enemyHSpacing = enemyWidth;
var enemyVSpacing = 10;

function Fleet (users, maxSize) {
  // FB Data
  this.ids = [];
  this.users = users;
  this.maxSize = maxSize;

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

	for (i in users) {
    // Create enemies until we hit our max size
    if (i >= maxSize) break;

    var user = users[i];
		var id = user.id;
    this.ids.push(id);

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
}

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
  this.el.toggleClass("dead");

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
  console.log("Enemy fired!");
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
