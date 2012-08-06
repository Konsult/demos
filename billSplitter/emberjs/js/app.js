var debugging = false;

function debug (string) {
  if (debugging)
    console.log(string);
}

var App = Em.Application.create({
  // Array of type App.Person
  people: [],
  personUnderMouse: null,

  // Array of type App.DraggableItemView
  sharedItems: [],
  totalTaxAndTip: null,

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
    App.totalTaxAndTip = App.TotalTaxAndTip.create();
    App.totalTaxAndTip.appendTo($("body"));

    App.addPersonButton = App.AddPersonButton.create();
    App.addPersonButton.appendTo($("body"));

    App.addPerson();
    App.addPerson();

    this.get("sharedItems").pushObject(App.SharedItem.create());
  },
});
