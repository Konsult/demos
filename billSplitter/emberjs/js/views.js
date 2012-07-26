App.AddPersonButton = Em.View.extend({
  templateName: "add-person-button",
  classNames: ["AddPersonButton", "btn"],

  click: function (e) {
    App.addPerson();
  },
});

App.TotalTaxAndTip = Em.View.extend({
  templateName: "total-tax-and-tip",

  tipView: null,
  totalView: null,
  taxView: null,

  tip: function () {
    var view = this.get("tipView");
    if (!view)
      return 0;

    var selection = view.get("selection");
    if (!selection)
      return 0;
    return selection.value;
  }.property("tipView.selection"),

  tax: function () {
    var view = this.get("taxView");
    if (!view)
      return 0;
    var tax = parseFloat(view.get("value"));
    if (isNaN(tax))
      return 0;
    return tax;
  }.property("taxView.value"),

  total: function () {
    var view = this.get("totalView");
    if (!view)
      return 0;
    var total = parseFloat(view.get("value"));
    if (isNaN(total))
      return 0;
    return total;
  }.property("totalView.value"),

  taxPercentage: function () {
    var total = this.get("total");
    if (!total)
      return NaN;
    return this.get("tax") / total;
  }.property("tax, total"),

  createChildView: function (viewClass, attrs) {
    var view = this._super(viewClass, attrs);
    var name = view.get("name");
    if (name === "total")
      this.set("totalView", view);
    else if (name === "tip")
      this.set("tipView", view);
    else if (name === "tax")
      this.set("taxView", view);

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
    var tip = App.totalTaxAndTip.get("tip");

    return (tip * this.get("person").get("totalWithoutTaxOrTip")).toFixed(2);
  }.property("person.totalWithoutTaxOrTip", "App.totalTaxAndTip.tip"),

  taxAmount: function () {
    var tax = App.totalTaxAndTip.get("taxPercentage");
    if (!isNaN(tax))
      return tax * this.get("person").get("totalWithoutTaxOrTip");

    // Don't know percentage, so just evenly split between people.
    tax = App.totalTaxAndTip.get("tax");
    return tax / App.people.length;

  }.property("App.people", "person.totalWithoutTaxOrTip", "App.totalTaxAndTip.tax", "App.totalTaxAndTip.total"),

  totalAmount: function () {
    var tip = parseFloat(this.get("tipAmount"));
    var subtotal = this.get("person").get("totalWithoutTaxOrTip");
    var tax = this.get("taxAmount");
    return (tip + subtotal + tax).toFixed(2);
  }.property("person.totalWithoutTaxOrTip", "tipAmount", "taxAmount"),

  totalDollar: function () {
    return this.get("totalAmount").split(".")[0];
  }.property("totalAmount"),
  totalCents: function () {
    return this.get("totalAmount").split(".")[1];
  }.property("totalAmount"),

  personChanged: function () {
    this.get("person").set("view", this);
  }.observes("person"),

  didInsertElement: function () {
    App.addedPersonView(this);
  },
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