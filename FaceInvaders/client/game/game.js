function Game (pel) {
  var that = this;
  this.score = 0;

  // Load External APIs
  this.apis = {};
  var fb = this.apis.fb = new FacebookAPI("485761404769776");

  fb.loadAsync(function () {
    if (fb.status == "out")
      that.showLogin();
  });

  // Create Game DOM Root
  var el = this.el = $("<div>");
  this.pel = pel;
  pel.append(el);

  // Snap to the Viewport
  var that = this;
  function resizeToViewport() {
    var w = that.w = $(window).width();
    var h = that.h = $(window).height();
    el.width(w); el.height(h);
  }
  $(window).resize(resizeToViewport);
  resizeToViewport();

  // Create Game Console
  var info = this.info = new InfoOverlay(this);
  var controls = this.controls = new Controls(this);

  // Create Game World
  var world = this.world = new World(this);
  var player = this.player = new Player(this);

  // Load Player
  fb.statusChange(function () {
    if (fb.status == "in") {
      that.balloon && that.balloon.die();
      player.load();
      that.startLevel(0);
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
Game.prototype.startLevel = function (id) {
  var world = this.world;
  var game = this;

  this.apis.fb.getFriends(function () {
    var ids = _.first(game.apis.fb.friendIDs, 18);
    world.fleet = new Fleet(ids, game);
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

  var el = this.el = $("<div>");
  el.addClass("World");
  game.el.append(el);

  this.h = el.height();
  this.w = el.width();

  this.el.append($("<div class='Foreground'>"));

  // Create the sky
  var day = $("<div class='DayContainer'>");
  day.append($("<div class='Sun'>"));
  this.el.append(day);

  var cloudContainer = $("<div class='CloudContainer'>");
  this.el.append(cloudContainer);
  for (var i = 0; i < 10; i++)
    createCloud(cloudContainer);
};
World.prototype.update = function (ms) {
  this.h = this.el.height();
  this.w = this.el.width();

  function u(o) {o && o.update(ms);};
  this.fleet && this.fleet.update(ms);
  _.each(this.enemies, u);
  _.each(this.bullets, u);
};
World.prototype.render = function () {
  function r(o) {o && o.render();};
  this.fleet && this.fleet.render();
  _.each(this.enemies, r);
  _.each(this.bullets, r);
};
