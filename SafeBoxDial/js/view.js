SafeBoxDial.Dial = Em.ContainerView.extend({
  // Subclasses should override these as appropriate.
  tickCount: 20,
  currentTick: 0,
  radius: 200,

  classNames: ["Dial", "Radial Metal"],
  isActive: false,

  updateRadius: function () {
    var dimension = this.get("radius") * 2 + "px";
    this.$().css({
      width: dimension,
      height: dimension,
    });
  }.observes("radius"),

  updateTicks: function () {
    if (!this.$)
      return;

    var jEl = this.$();
    var ticks = jEl.find(".Tick");
    var currNumTicks = ticks.length;
    var targetNumTicks = this.get("tickCount");
    var rotationIncrement =  360 / targetNumTicks;

    if (currNumTicks > targetNumTicks) {
      // Remove extra ticks.
    } else if (currNumTicks < targetNumTicks) {
      // Add more ticks.
      for (var i = currNumTicks; i < targetNumTicks; i++) {
        var tick = SafeBoxDial.Tick.create({
          number: i.toString(),
          rotation: rotationIncrement * i,
        });

        if (currNumTicks + i == this.get("currentTick")) {
          tick.reopen({
            didInsertElement: function () {
              this.$().addClass("Selected");
            }
          })
        }

        this.get("childViews").pushObject(tick);
      }
    }
  }.observes("tickCount"),

  currentTickUpdated: function() {
    this.$().find(".Tick.Selected").removeClass("Selected");
    $(this.$().find(".Tick")[this.get("currentTick")]).addClass("Selected");
  }.observes("currentTick"),

  didInsertElement: function () {
    this._super();
    this.updateRadius();
    this.updateTicks();
  },
});

SafeBoxDial.Tick = Em.View.extend({
  templateName: "Tick",
  classNames: ["Tick"],

  number: "",
  rotation: 0,

  didInsertElement: function () {
    this._super();
    var rotateCss = "rotate(" + this.get("rotation") + "deg)";
    this.$().css({
      "-webkit-transform": rotateCss,
      "-o-transform": rotateCss,
      "-moz-transform": rotateCss,
      "-ms-transform": rotateCss
    });
  },
});