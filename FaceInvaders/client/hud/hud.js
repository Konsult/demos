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
  lives.append("Lives: ");
  el.append(lives);
};
InfoOverlay.prototype.update = function (ms) {
  this.score[0].innerHTML = "Score: "+this.game.score;

  var lifeCount = this.game.player.lives;
  if (lifeCount === 0) {
    this.lives[0].innerHTML = "Lives: 0";
    return;
  }

  var oldLives = this.lives.children(".Heart");
  var oldLifeCount = oldLives.length;
  for (var i = oldLifeCount; i < lifeCount; i++)
    this.lives.append($("<div class='Heart'>"));
  for (var i =oldLifeCount - 1; i >= lifeCount; i--)
    $(oldLives[oldLifeCount - 1 - i]).remove();
};
InfoOverlay.prototype.render = function (ms) {
  
};
InfoOverlay.prototype.set = function (key, value) {
  if (typeof value == "undefined") for (i in key) this.set(i, key[i]);
  else if (typeof value == "function") this[key] = value;
  else this[key] = function () { return value; };
};
