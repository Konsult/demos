var debugging = false;

function debug (string) {
  if (debugging)
    console.log(string);
}

var App = Em.Application.create({
  // Array of type App.Person
  people: [],
  personUnderMouse: null,
  grandTotal: "$0.00",

  // Array of type App.DraggableItemView
  sharedItems: [],
  totalTaxAndTip: null,

  updateGrandTotal: function () {
    var amount = 0;
    var people = this.get("people");
    for(var i = 0; i < people.length; i++) {
      var person = people[i];
        amount += person.get("totalWithoutTaxOrTip") + person.get("tax") + person.get("tip");
    }

    this.set("grandTotal", "$" + amount.toFixed(2));
  }.observes("people.length", "people.@each.totalWithoutTaxOrTip", "totalTaxAndTip.tip", "totalTaxAndTip.taxView.value"),

  addPerson: function () {
    var person = App.Person.create({
      id: App.people.length + 1,
      items: [],
    });
    person.addItem();
    App.get("people").pushObject(person);
  },

  addedPersonView: function (view) {
    var personContainer = $("#PersonContainer");
    var personWidth = view.$().outerWidth(true);
    personContainer.width(personContainer.width() + personWidth);

    // Don't scroll if this is during initialization.
    if (App.people.length < 3)
      return;

    $("#scrollablePersonContainer").animate({
      scrollLeft: personContainer.outerWidth(true),
    }, 500);
  },

  sharedItemFocusIn: function (item) {
    var items = this.get("sharedItems");
    // If this is the item, add another item after it.
    if (item === items[items.length - 1])
      items.pushObject(App.SharedItem.create());
  },

  sharedItemFocusOut: function(item) {
    if (!item.get("value"))
      this.get("sharedItems").removeObject(item);
  },

  ready: function () {
    var taxAndTip = App.TotalTaxAndTip.create();
    App.set("totalTaxAndTip", taxAndTip);
    taxAndTip.appendTo($("body"));

    var personContainer = $("#PersonContainer");
    App.addPersonButton = App.AddPersonButton.create({
      didInsertElement: function () {
        personContainer.width(personContainer.width() + this.$().outerWidth(true));
      }
    });
    App.addPersonButton.appendTo($("#PersonContainer"));

    App.addPerson();
    App.addPerson();

    this.get("sharedItems").pushObject(App.SharedItem.create());
  },
});
