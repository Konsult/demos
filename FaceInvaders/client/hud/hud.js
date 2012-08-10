function Controls (game) {
  this.game = game;

  var el = this.el = $("<div>");
  el.addClass("Controls");
  game.el.append(el);

  var toggle = $("<div>");
  toggle.addClass("Toggle");
  el.append(toggle);

  var inputs = this.inputs = {
    keyboard: {
      on: false,
      el: $("<div>").appendTo(toggle).addClass("ToggleKeyboard")
    },
    mouse: {
      on: true,
      el: $("<div>").appendTo(toggle).addClass("ToggleMouse").addClass("toggled")
    }
  };

  inputs.keyboard.el.click({me:inputs.keyboard}, function (e) {
    e.data.me.on = !e.data.me.on;
    e.data.me.el.toggleClass("toggled");
  });
  inputs.mouse.el.click({me:inputs.mouse}, function (e) {
    e.data.me.on = !e.data.me.on;
    e.data.me.el.toggleClass("toggled");
  });

  this.init();
};
Controls.prototype.init = function () {
  var doc = $(document);
  var data = {game: this.game};

  // Keyboard
  doc.keydown(data, function (e) {
    var game = e.data.game;
    var player = game.player;

    if (e.which == 32 && player)
      player.fire();
    if (e.which == 37 && player)
      player.stepLeft();
    if (e.which == 39 && player)
      player.stepRight();
  });

  // Mouse
  doc.click(data, function (e) {
    var game = e.data.game;
    var player = game.player;

    player && player.fire();
  });
  doc.mousemove(data, function (e) {
    var game = e.data.game;
    var player = game.player;

    player && player.goto(e.pageX);
  });

  // Touch
  doc.bind("touchmove", data, function (e) {
    var game = e.data.game;
    var player = game.player;

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
