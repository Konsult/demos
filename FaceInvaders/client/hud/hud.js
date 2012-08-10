function Controls (game) {
  this.game = game;

  var el = this.el = $("<div>");
  el.addClass("Controls");
  game.el.append(el);

  this.el[0].innerHTML = "Controlz!";
  this.init();
};
Controls.prototype.init = function () {
  var doc = $(document);
  var player = this.game.player;

  // Setup Keyboard Listeners
  doc.keydown(function (e) {
    var player = window.app.player;
    if (e.which == 32 && player)
      player.fire();
    if (e.which == 37 && player)
      player.stepLeft();
    if (e.which == 39 && player)
      player.stepRight();
  });
  doc.click(function () {
    var player = window.app.player;
    player && player.fire();
  });
  doc.mousemove(function (e) {
    var player = window.app.player;
    player && player.goto(e.pageX);
  });
  doc.bind("touchmove", function (e) {
    var player = window.app.player;
    player && player.goto(e.pageX);
  });
};

function InfoOverlay (game) {
  this.game = game;

  var el = this.el = $("<div>");
  el.addClass("InfoOverlay");
  game.el.append(el);

  var score = this.score = $("<div>");
  score.addClass("Score");
  el.append(score);

  var lives = this.lives = $("<div>");
  lives.addClass("Lives");
  el.append(lives);
};
InfoOverlay.prototype.update = function (ms) {
  this.score[0].innerHTML = "Score: "+this.game.score;
  this.lives[0].innerHTML = "Lives: "+this.game.player.lives;
};
InfoOverlay.prototype.render = function (ms) {
  
};
InfoOverlay.prototype.set = function (key, value) {
  if (typeof value == "undefined") for (i in key) this.set(i, key[i]);
  else if (typeof value == "function") this[key] = value;
  else this[key] = function () { return value; };
};
