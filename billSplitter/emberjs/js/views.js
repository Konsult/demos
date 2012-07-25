App.TotalTaxAndTip = Em.View.extend({
  templateName: "total-tax-and-tip",

  tip: null,
  total: null,
  tax: null,

  createChildView: function (viewClass, attrs) {
    var view = this._super(viewClass, attrs);
    var name = view.get("name");
    if (name === "total")
      this.set("total", view);
    else if (name === "tip")
      this.set("tip", view);
    else if (name === "tax")
      this.set("tax", view);

    return view;
  },
});

App.TipSelect = Em.Select.extend({
  attributeBindings: ["name"],
  content: Em.A([
      { name: "0%", value: 0, },
      { name: "5%", value: 0.05, },
      { name: "10%", value: 0.1, },
      { name: "15%", value: 0.15, },
      { name: "17%", value: 0.17, },
      { name: "20%", value: 0.20, },
      { name: "25%", value: 0.25, },
    ]),
  optionLabelPath: "content.name",
  optionValuePath: "content.value",

  didInsertElement: function () {
    this.$().find("option[value='0.15']").attr("selected", "selected");
  },
});

App.PersonView = Em.View.extend({
  templateName: "person",
  classNames:["Person"],

  person: null, // Will be bound when view is inserted.

  tipAmount: function () {
    var tip = 0;
    try {
      tip = App.totalTaxAndTip.tip.selection.value;
    } catch (e) {};

    return (tip * this.get("person").get("totalWithoutTaxOrTip")).toFixed(2);
  }.property("person.totalWithoutTaxOrTip", "App.totalTaxAndTip.tip.selection"),

  totalDollar: "0",
  totalCents: "00",

  personChanged: function () {
    this.get("person").set("view", this);
  }.observes("person"),
});


App.ItemView = Em.View.extend({
  templateName: "item",
  classNames: ["ItemPrice"],

  item: null, // Will be bound when view is inserted
  input: null, // Will be bound when view is created

  itemChanged: function () {
    this.get("item").set("view", this);
  }.observes("item"),

  focusIn: function (e) {
    this.get("item").focusIn(e);
  },

  focusOut: function (e) {
      this.get("item").focusOut(e);
  },

  createChildView: function (viewClass, attrs) {
    var view = this._super(viewClass, attrs);

    if (view.classNames.contains("CurrencyInput"))
      this.set("input", view);

    return view;
  },
});

// FIXME: Break this out so it's a reusable component.
App.CurrencyInput = Em.TextField.extend({
  classNames: ["CurrencyInput"],
  attributeBindings: ["name", "pattern"],
  type: "text",
  pattern: "[0-9]*",

  focusIn: function (e) {
    var fieldElement = e.target;
    if (!fieldElement.value)
      fieldElement.value = "0.00";
    this.moveSelectionToEnd(fieldElement);
  },

  focusOut: function (e) {
    if (!parseFloat(e.target.value))
      e.target.value = "";
  },

  keyPress: function (e) {
    var value = String.fromCharCode(e.charCode);

    if (!value)
      return;

    e.preventDefault();
    e.stopPropagation();

    value = parseInt(value);
    if (isNaN(value))
      return;

    // Compute new value
    var fieldElement = e.target;
    var oldValue = parseFloat(fieldElement.value);
    value = parseFloat(oldValue) * 10 + value / 100;
    fieldElement.value = value.toFixed(2);
  },

  keyDown: function (e) {
    // Override backspace so we maintain the right formatting
    if(e.keyCode !== "\b".charCodeAt(0))
      return;

    e.preventDefault();
    e.stopPropagation();

    var fieldElement = e.target;
    var oldValue = parseFloat(fieldElement.value);
    var value = Math.min(oldValue / 10);
    fieldElement.value = (value).toFixed(2);
  },

  mouseUp: function (e) {
    // Override WebKit's setting of position to where the mouse clicked.
    this.moveSelectionToEnd(e.target);
  },

  moveSelectionToEnd: function (element) {
    var end = element.value.length;
    element.setSelectionRange(end, end);
  },
});