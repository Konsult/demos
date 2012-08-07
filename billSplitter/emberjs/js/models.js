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
    return App.get("totalTaxAndTip").get("tip") * this.get("totalWithoutTaxOrTip");
  }.property("totalWithoutTaxOrTip", "App.totalTaxAndTip.tip"),

  tax: function () {
    return App.get("totalTaxAndTip").taxForPersonSubtotal(this.get("totalWithoutTaxOrTip"));
  }.property("App.people.length", "totalWithoutTaxOrTip", "App.totalTaxAndTip.taxView.value"), 

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
  person: null, // Will be set by the constructor
  view: null, // Will be set by ItemView.

  value: function () {
    var view = this.get("view");
    if (!view)
      return 0;
    var value = view.numericValue();
    return isNaN(value) ? 0 : value;
  }.property("view.value"),

  focusIn: function (e) {
    var person = this.get("person");
    if (person)
      this.get("person").itemFocusIn(this);
  },

  focusOut: function (e) {
    var person = this.get("person");
    if (person && !this.get("value"))
      this.get("person").removeItem(this);
  },
});

App.SharedItem = App.Item.extend({
  view: null, // Will be set by DraggableItemView.

  portionedItems: null, // Array of App.PortionedSharedItem, will be initialized on creation.

  portionedItemPrice: function () {
    var items = this.get("portionedItems");
    if (!items || !items.length)
      return 0;

    return this.get("value") / items.length;
  }.property("portionedItems"),

  focusIn: function (e) {
    App.sharedItemFocusIn(this);
  },

  focusOut: function (e) {
    App.sharedItemFocusOut(this);
  },

  viewChanged: function () {
    this.get("view").reopen({
      didInsertElement: function () {
        this._super();
        // Give each view a unique background color.
        var randomHue = Math.round(Math.random() * 255);
        this.$().css("background-color", "hsl(" + randomHue + ", 100%, 95%)");
      },
    });
  }.observes("view"),
});

App.PortionedSharedItem = App.Item.extend({
  parentItem: null, // App.SharedItem. Will be set by the constructor.

  value: function () {
    var parentItem = this.get("parentItem");
    if (!parentItem)
      return 0;
    return parentItem.get("portionedItemPrice");
  }.property("parentItem.portionedItemPrice"),
});