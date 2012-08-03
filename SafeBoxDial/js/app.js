var SafeBoxDial = Em.Application.create({
  bigDial: null,
  mediumDial: null,
  smallDial: null,
  buttonView: null,

  // Yah yah, whatever.
  secret1: 5,
  secret2: 5,
  secret3: 5,

  width: 280,

  ready: function () {
    var container = $("body");

    SafeBoxDial.Dial.reopen({
      didInsertElement: function () {
        this._super();
        var margin = -this.get("radius") + "px";
        this.$().css({
          "margin-top": margin,
          "margin-left": margin,
        });
      },
    });

    var bigRadius = this.width / 2;
    this.bigDial = SafeBoxDial.Dial.create({
      radius: this.width / 2,
      tickCount: 20,
      classNames: ["BigDial"],
    });
    this.bigDial.appendTo(container);

    var mediumRadius = bigRadius - 37;
    this.mediumDial = SafeBoxDial.Dial.create({
      radius: this.width / 2 - 37,
      tickCount: 15,
      classNames: ["MediumDial"],
    });
    this.mediumDial.appendTo(container);

    var smallRadius = mediumRadius - 37;
    this.smallDial = SafeBoxDial.Dial.create({
      radius: this.width / 2 - 37 - 37,
      tickCount: 10,
      classNames: ["SmallDial"],
    });
    this.smallDial.appendTo(container);

    var buttonRadius = smallRadius - 37;
    this.buttonView = $("<div>Go</div>").addClass("Radial Metal Dial Button");
    this.buttonView.css({
      position: "absolute",
      top: "50%",
      left: "50%",
      width: buttonRadius * 2 + "px",
      height: buttonRadius * 2 + "px",
      "margin-top": -buttonRadius + "px",
      "margin-left": -buttonRadius + "px",
      "z-index": 5,
    });
    container.append(this.buttonView);

    this.buttonView.on("click", function (e) {
      var one = parseInt(Em.View.views[SafeBoxDial.bigDial.$().find(".Tick.Selected").attr("id")].get("number"));
      var two = parseInt(Em.View.views[SafeBoxDial.mediumDial.$().find(".Tick.Selected").attr("id")].get("number"));
      var three = parseInt(Em.View.views[SafeBoxDial.smallDial.$().find(".Tick.Selected").attr("id")].get("number"));

      if (one !== SafeBoxDial.secret1 || two !== SafeBoxDial.secret2 || three !== SafeBoxDial.secret3) {
        $("body").addClass("Wrong");
      } else
        $("body").addClass("Right");

      setTimeout(SafeBoxDial.reset, 500);
    });
  },

  reset: function () {
    function resetDial(dial) {
      var that = dial;
      function finishReset (e) {
        that.$().removeClass("Reset");
        $("body").removeClass("Wrong Right");
      }

      if (dial.get("currentTick")) {
        dial.$().one("transitionend oTransitionEnd webkitTransitionEnd", finishReset);
        dial.rotate(0);
        dial.updateCurrentTick(0);
      } else
        setTimeout(finishReset, 1000);

      dial.$().addClass("Reset");
    }

    resetDial(SafeBoxDial.bigDial);
    resetDial(SafeBoxDial.mediumDial);
    resetDial(SafeBoxDial.smallDial);
  },
});