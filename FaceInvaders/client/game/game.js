function Game (pel) {
  var that = this;
  this.score = 0;
  this.level = 0;

  // Load External APIs
  this.apis = {};
  var fb = this.apis.fb = new FacebookAPI("485761404769776");
  fb.loadAsync(function () {
    setTimeout(function () {
      if (fb.status == "out")
        that.showLogin();
    }, 1000);
  });

  // App Size Constants
  this.consoleHeight = 80;

  // Create Game DOM Root
  var el = this.el = $("<div>");
  this.pel = pel.append(el);

  // Create Game World
  var world = this.world = new World(this);
  var player = this.player = new Player(this);

  // Create Game Console
  var info = this.info = new InfoOverlay(this);
  var controls = this.controls = new Controls(this);

  // Create Flying Message Box
  var flybox = this.flybox = $("<div>").addClass("LevelText").appendTo(this.el);
  flybox.title = $("<h1>").appendTo(flybox);

  // Create Effects Layer
  var effects = this.effects = new Effects(this);

  // Load Player
  fb.statusChange(function () {
    if (fb.status == "in") {
      that.balloon && that.balloon.die();
      player.load();
      that.startNextLevel();
    }
  });

  this.launch();
};
Game.prototype.launch = function () {
  var that = this;
  that.launchTime = that.time = (new Date()).getTime();

  function loop () {
    that.raf = window.requestAnimationFrame(loop);
    var now = (new Date()).getTime();
    var ms = now - that.time;
    that.time = now;

    that.update(ms);
    that.render();
  };
  loop();
};
Game.prototype.update = function (ms) {
  this.player.update(ms);
  this.world.update(ms);
  this.info.update(ms);
};
Game.prototype.render = function () {
  this.player.render();
  this.world.render();
  this.info.render();
};
Game.prototype.showLogin = function () {
  var that = this;
  var fb = this.apis.fb;

  var tooltip = new Tooltip("Shoot this to begin");

  var msg = "Log In to Facebook";
  var onhit = function () {
    fb.login();
    that.balloon = null;
    tooltip.el.remove();
  };
  var balloon = this.balloon = new BalloonButton(msg, onhit);

  var el = balloon.el;
  var world = this.world;

  world.el.append(el);
  world.el.append(tooltip.el);

  var offset = {
    left: (world.w - el.outerWidth(true)) / 2,
    top: (world.h - el.outerHeight(true)) / 2,
  };
  el.offset(offset);

  tooltip.el.offset({
    top: offset.top - tooltip.el.outerHeight(true),
    left: world.w / 2,
  });
};
Game.prototype.startNextLevel = function () {
  var game = this;
  var world = this.world;
  var level = Levels[this.level++];

  var flybox = this.flybox;
  flybox.title.html("Level "+this.level);
  setTimeout(function () {flybox.addClass("in");}, 0);
  setTimeout(function () {flybox.addClass("out");}, 2000);

  this.apis.fb.getFriends(function () {
    var ids = _.first(game.apis.fb.friendIDs, level.count);
    var fleet = new Fleet(ids, game);
    fleet.setFormation(level.formation);
    fleet.setSpeed(level.speed);
    world.enemies["MainFleet"] = fleet;
  });
};
Game.prototype.collides = function (A, B) {
  var a = A.el; var b = B.el;

  // Currently assumes only DOM nodes' rects for collisions
  function left (x) { return x.offset().left };
  function right (x) { return left(x) + x.width(); };
  function top (x) { return x.offset().top; };
  function bottom (x) { return top(x) + x.height(); };

  return !(left(a) > right(b)
        || right(a) < left(b)
        || top(a) > bottom(b)
        || bottom(a) < top(b));
};

function World (game) {
  this.game = game;
  this.enemies = {};
  this.bullets = {};

  var el = this.el = $("<div>").addClass("World").appendTo(game.el);
  el.css("bottom", game.consoleHeight+"px");

  // Update Size w.r.t. the Viewport
  var that = this;
  function resizeToViewport() {
    that.w = $(window).width();
    that.h = $(window).height() - that.game.consoleHeight;
  }
  $(window).resize(resizeToViewport);
  resizeToViewport();

  // Foreground Layer
  this.el.append($("<div class='Foreground'>"));

  // Sky Layer
  var sky = $("<div class='RotatingSky'>").appendTo(el);
  sky.append($("<div class='Sun'>"));

  // Cloud Layer
  var clouds = $("<div class='CloudContainer'>").appendTo(el);
  for (var i = 0; i < 10; i++) {
    createCloud(clouds);
  }

  // Night Layer
  createNightSky(sky, 10);
};
World.prototype.update = function (ms) {
  function u(o) {o && o.update(ms);};
  _.each(this.enemies, u);
  _.each(this.bullets, u);
};
World.prototype.render = function () {
  function r(o) {o && o.render();};
  _.each(this.enemies, r);
  _.each(this.bullets, r);
};
