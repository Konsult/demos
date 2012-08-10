function Controls (game) {
  this.game = game;
  this.keyboard;
  this.mouse;

  var el = this.el = $("<div>");
  el.addClass("Controls");
  game.el.append(el);

  var toggle = $("<div>");
  toggle.addClass("Toggle");
  el.append(toggle);

  var keyboard = this.keyboard = {
    on: false,
    el: $("<div>").appendTo(toggle).addClass("ToggleKeyboard"),
    onkeydown: function (e) {
      var player = e.data.game.player;

      if (e.which == 32 && player)
        player.fire();
      if (e.which == 37 && player)
        player.stepLeft();
      if (e.which == 39 && player)
        player.stepRight();
    },
    toggle: function (e) {
      var me = e.data.keyboard;
      var on = e.data.keyboard.on = !me.on;
      me.el.toggleClass("toggled");

      var doc = $(document);
      if (on) doc.keydown(e.data, me.onkeydown);
      else doc.off("keydown");
    }
  };
  keyboard.el.click(this, keyboard.toggle);

  var mouse = this.mouse = {
    on: false,
    el: $("<div>").appendTo(toggle).addClass("ToggleMouse"),
    onclick: function (e) {
      var player = e.data.game.player;
      player && player.fire();
    },
    onmove: function (e) {
      var player = e.data.game.player;
      player && player.goto(e.pageX);
    },
    toggle: function (e) {
      var me = e.data.mouse;
      var on = e.data.mouse.on = !me.on;
      me.el.toggleClass("toggled");

      var doc = $(document);
      if (on) {
        doc.click(e.data, mouse.onclick);
        doc.mousemove(e.data, mouse.onmove);
      } else {
        doc.off("click");
        doc.off("mousemove");
      }
    }
  };
  mouse.el.click(this, mouse.toggle);

  // By default, turn on keyboard, leave on touch permanently
  keyboard.el.click();
  $(document).bind("touchmove", this, function (e) {
    var game = e.data.game.player;
    player && player.goto(e.pageX);
  });
};
