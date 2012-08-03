var SafeBoxDial = Em.Application.create({
  bigDial: null,
  mediumDial: null,
  smallDial: null,

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

    var mediumRadius = bigRadius - 40;
    this.mediumDial = SafeBoxDial.Dial.create({
      radius: this.width / 2 - 40,
      tickCount: 15,
      classNames: ["MediumDial"],
    });
    this.mediumDial.appendTo(container);

    var smallRadius = mediumRadius - 40;
    this.smallDial = SafeBoxDial.Dial.create({
      radius: this.width / 2 - 40 - 40,
      tickCount: 10,
      classNames: ["SmallDial"],
    });
    this.smallDial.appendTo(container);
  },
});