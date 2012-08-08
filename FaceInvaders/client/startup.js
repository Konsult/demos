var App = {
  raf: null,
  time: (new Date()).getTime(),

  Player: null,
  Fleet: null,
  enemies: {},
  playerShots: [],
  enemyShots: [],

  el: null,
  w: 800, h: 600,

  launch: function (pel) {
    // Set up DOM
    var el = App.el = $("<div>");
    el.width(App.w);
    el.height(App.h);
    el.toggleClass("App");
    pel.append(el);

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
    // el.mousemove(function (e) {
    //   e.target.offsetX
    // });

    App.main();
  },
  loadPlayer: function (playerID) {
    var p = App.Player = new Player(playerID);
    App.el.append(p.el);
  },
  loadGame: function (gameID) {
    switch (gameID) {
      default:
        // Set up world map
        App.el.css("background-color", "green");

        // Create enemies/fleets
        var f = App.Fleet = new Fleet([4, 5, 6]);
        App.el.append(f.el);
        break;
    }
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
        o.update(ms);
      }
    };
  },
  render: function () {
    App.Player && App.Player.render();
    App.Fleet && App.Fleet.render();

    function renderAll (L) {
      for (i in L) {
        var o = L[i];
        o.render();
      }
    };
  }
};

function Player (id) {
  // Self State
  this.id = id;
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

  // Add face
  this.el.append("<div class='Face'>");
  // Add face image in here, 100%x100%.

  // Add body
  this.el.append("<div class='Body'>");

  // Add wheels
  var wheelContainer = $("<div class='WheelContainer'>");
  for (var i = 0; i < 5; i++)
    wheelContainer.append($("<div class='wheel'>"));
  this.el.append(wheelContainer);

  this.load();
};
Player.prototype.load = function () {
  // this.state = "loading";
  // Load friend list, photos, and other info from FB
  // Onload, set this.state = "alive";
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
  console.log("Player fires!");

  this.el.addClass("Fire");
  var that = this;
  setTimeout(function () {
    // Emit a player bullet from our current location
    that.el.removeClass("Fire");
  }, 150);
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



function Fleet (ids) {
  // Self State
  this.ids = ids;
  this.x = this.y = 64;
  this.w = this.h = 64 * 6;
  this.state = "alive";
  this.deadAt = null;

  // Movement State
  this.moveType = "step"; // Move by steps
  this.stepLength = 10;   // 10px wide steps
  this.stepInterval = 500;
  this.stepDirection = "right";
  this.lastStep = (new Date()).getTime();

  // DOM State
  var el = this.el = $("<div>");
  this.el.toggleClass("Group");
  this.el.toggleClass("Fleet");
  this.setSize(this.w, this.h);

  // Construct Fleet
  this.numAlive = this.ids.length;
  var guys = this.guys = {};
  var x = 10;
  var y = 10;

	for (i in ids) {
		var id = ids[i];
		var guy = guys[id] = App.enemies[id] = new Enemy(id);
    guy.fleet = this;
    el.append(guy.el);
    guy.moveTo(x, y);
    x += 100;
	}
};
Fleet.prototype.update = function(ms) {
  if (this.state == "dead") return;

  // If all our guys die, blow ourselves up
  if (this.numAlive == 0) {
    this.die();
    return;
  }

  // Compute time since last step
  var since = App.time - this.lastStep;
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

  // On every step, fire a random guy
  var that = this;
  var timeToFire = Math.random() * 500;
  setTimeout(function () {

    var num = that.numAlive * Math.random();
    num = Math.round(num-0.5);
    for (var i = 0; i < that.guys.length; i++) {
      if (!num) {
        that.guys[i].fire();
        break;
      }
      if (that.guys[i].state == "alive") num--;
    }

  }, timeToFire);
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
  this.y += this.stepLength;
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
  this.w = this.h = 64;
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

Meteor.startup(function () {
  var el = $(document.body);
  App.launch(el);
  App.loadPlayer(0);
  App.loadGame(0);
});
