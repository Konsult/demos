var App = {
  raf: null,
  time: (new Date()).getTime(),

  Player: null,
  playerBullets: [],
  fleets: [],
  enemyBullets: [],

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
        // Set world map
        // Create enemies/fleets
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
    if (App.Player)
      App.Player.update(ms);

    function updateAll (L) {
      for (i in L) {
        var o = L[i];
        o.update(ms);
      }
    };
    updateAll(App.fleets);
  },
  render: function () {
    if (App.Player)
      App.Player.render();

    function renderAll (L) {
      for (i in L) {
        var o = L[i];
        o.render();
      }
    };
    renderAll(App.fleets);
  }
};

function Player (id) {
  // Self State
  this.id = id;
  this.x = this.tx = this.px = 0;
  this.w = 100;
  this.h = 95;

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

  this.deadAt = null;

  this.state = "alive";
  this.load();
};
Player.prototype.load = function () {
  // this.state = "loading";
  // Load friend list, photos, and other info from FB
  // Onload, set this.state = "alive";
};
Player.prototype.update = function (ms) {
  this.px = this.x;
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
  this.x = this.y = 0;
  this.w = this.h = 64 * 6;

  // Movement State
  this.moveType = "step"; // Move by steps
  this.stepLength = 10;   // 10px wide steps
  this.speed = 2;         // 2 steps / second

  // DOM State
  var el = this.el = $("<div>");
  this.el.toggleClass("Group");
  this.el.toggleClass("Fleet");

  // Construct Fleet
  this.guys = {};
	for (i in ids) {
		var id = ids[i];
		var guy = this.guys[id] = new Enemy(id);
    el.append(guy.el);
    guy.fleet = this;
	}
};
Fleet.prototype.update = function(x,y) {
  // Step the fleet when needed
};
Fleet.prototype.render = function(x,y) {
  // Update the fleet's DOM
};
Fleet.prototype.stepLeft = function () {
  if (this.tx > this.x) {
    this.tx = this.x;
    return;
  }

  var tx = this.tx - this.stepLength;
  this.tx = Math.max(tx, 0);
};
Fleet.prototype.stepRight = function () {
  if (this.tx < this.x) {
    this.tx = this.x;
    return;
  }

  var tx = this.tx + this.stepLength;
  var max = App.w - this.w;
  this.tx = Math.min(tx, max);
};
Fleet.prototype.stepDown = function () {
  if (this.tx > this.x) {
    this.tx = this.x;
    return;
  }

  var tx = this.tx - this.stepLength;
  this.tx = Math.max(tx, 0);
};
Fleet.prototype.setSize = function (w,h) {
  this.w = w;
  this.h = h;
  this.el.width(w);
  this.el.height(h);
};

function Enemy (id) {
  // Self State
  this.id = id;
  this.fleet = null;

  // Movement State
  this.moveType = "linear"; // Move via smooth linear motion
  this.speed = 200;         // 200px / second

  // DOM State
  this.el = $("<div>");
  this.el.toggleClass("Unit");
  this.el.toggleClass("Enemy");
};
Enemy.prototype.moveTo = function(x,y) {
  this.x = x;
  this.y = y;
  this.el.css("top", this.y+"px");
  this.el.css("left", this.x+"px");
};
Enemy.prototype.setSize = function (w,h) {
  this.w = w;
  this.h = h;
  this.el.width(w);
  this.el.height(h);
};

Meteor.startup(function () {
  var el = $(document.body);
  App.launch(el);
  App.loadPlayer(0);
});
