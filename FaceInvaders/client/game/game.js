function Game (pel) {
  var that = this;
  this.score = 0;
  this.level = 0;
  this.inplay = false;

  // Load External APIs
  this.apis = {};
  var fb = this.apis.fb = new FacebookAPI("485761404769776");
  fb.loadAsync();

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

  // On login/logout
  fb.statusChange(function () {
    if (fb.status == "in") {
      if (that.balloon) {
        that.balloon.die();
        delete that.world.enemies["LoginBalloon"];
      }
      that.balloon = null;
      that.player.load();
      that.startNextLevel();
    } else {
      that.balloon = new LoginBalloon(fb, that.world);
      that.world.enemies["LoginBalloon"] = that.balloon;
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
  var changeLevel = this.inplay && !_.find(this.world.enemies, function () {return true;});
  changeLevel && this.startNextLevel();

  this.player.update(ms);
  this.world.update(ms);
  this.info.update(ms);
};
Game.prototype.render = function () {
  this.player.render();
  this.world.render();
  this.info.render();
};
Game.prototype.startNextLevel = function () {
  var game = this;
  var world = this.world;
  var level = Levels[this.level++];

  var flybox = this.flybox;
  flybox.title.html("Level "+this.level);
  flybox.removeClass("in");
  flybox.removeClass("out");
  setTimeout(function () {flybox.addClass("in");}, 0);
  setTimeout(function () {flybox.addClass("out");}, 2000);

  // Load friend list if needed
  if (!game.apis.fb.friendIDs.length)
    this.apis.fb.getFriends();

  game.inplay = false;
  function start() {
    if (game.inplay) return;
    if (!game.apis.fb.friendIDs.length)
      setTimeout(start,500);

    var ids = _.first(game.apis.fb.friendIDs, level.count);
    var fleet = new Fleet(ids, game);
    fleet.setFormation(level.formation);
    fleet.setSpeed(level.speed);
    fleet.id = "MainFleet";
    world.enemies[fleet.id] = fleet;
    game.inplay = true;
  };
  setTimeout(start,2000);
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
  function u(o) {o && o.update && o.update(ms);};
  _.each(this.enemies, u);
  _.each(this.bullets, u);
};
World.prototype.render = function () {
  function r(o) {o && o.render && o.render();};
  _.each(this.enemies, r);
  _.each(this.bullets, r);
};
