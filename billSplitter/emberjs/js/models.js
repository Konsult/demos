App.Person = Em.Object.extend({
  view: null, // Will be set by PersonView

  items: [], // Array of Items

  totalWithoutTaxOrTip: function () {
    var sum = 0;

    this.get("items").forEach(function (item) {
      var value = parseFloat(item.get("value"));
      if (!isNaN(value))
        sum += value;
    });

    return sum;

  }.property("items.@each.value"),

  removeItem: function (item) {
    var items = this.get("items");
    if (item !== items[items.length - 1])
      items.removeObject(item);
  },

  addItem: function () {
    this.get("items").pushObject(App.Item.create({
      person: this,
    }));
  },

  itemFocusIn: function (item) {
    var items = this.get("items");
    if (item === items[items.length - 1])
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
    var input = view.get("input");
    if (!input)
      return 0;
    return input.get("value");
  }.property("view.input.value"),

  focusIn: function (e) {
    this.get("person").itemFocusIn(this);
  },

  focusOut: function (e) {
    if (!parseFloat(this.get("value")))
      this.get("person").removeItem(this);
  },
});
