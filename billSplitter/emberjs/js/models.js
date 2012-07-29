App.Person = Em.Object.extend({
  view: null, // Will be set by PersonView

  items: null, // Array of Items

  totalWithoutTaxOrTip: function () {
    var sum = 0;

    this.get("items").forEach(function (item) {
      var value = parseFloat(item.get("value"));
      if (!isNaN(value))
        sum += value;
    });

    return sum;

  }.property("items.@each.value"),

  tip: function () {
    return App.totalTaxAndTip.get("tip") * this.get("totalWithoutTaxOrTip");
  }.property("totalWithoutTaxOrTip", "App.totalTaxAndTip"),

  tax: function () {
    var tax = App.totalTaxAndTip.get("taxPercentage");
    if (!isNaN(tax))
      return tax * this.get("totalWithoutTaxOrTip");

    // Don't know percentage, so just evenly split between people.
    tax = App.totalTaxAndTip.get("tax");
    return tax / App.people.length;
  }.property("App.people", "totalWithoutTaxOrTip", "App.totalTaxAndTip.tax", "App.totalTaxAndTip.total"), 

  removeItem: function (item) {
    var items = this.get("items");
    if (item !== items[0])
      items.removeObject(item);
  },

  addItem: function () {
    this.get("items").unshiftObject(App.Item.create({
      person: this,
    }));
  },

  itemFocusIn: function (item) {
    var items = this.get("items");
    if (item === items[0])
      this.addItem();
  },
});

App.Item = Em.Object.extend({
  person: null, // Will be set by constructor
  view: null, // Will be set by ItemView.

  value: function () {
    var view = this.get("view");
    if (!view)
      return 0;
    return view.get("value");
  }.property("view.value"),

  focusIn: function (e) {
    this.get("person").itemFocusIn(this);
  },

  focusOut: function (e) {
    if (!parseFloat(this.get("value")))
      this.get("person").removeItem(this);
  },
});
