var App = Em.Application.create({
  // Array of type App.Person
  people: [],
  totalTaxAndTip: null,

  addPerson: function () {
    var person = App.Person.create({
      items: [],
    });
    person.addItem();
    App.get("people").pushObject(person);
  },

  addedPersonView: function (view) {
    // FIXME: Adding a person adds an item to every person
    // FIXME: Adding a person breaks responsiveness for people
    var personContainer = $("#PersonContainer");
    var personWidth = view.$().outerWidth(true);
    personContainer.width(personContainer.width() + personWidth);

    // Don't scroll if this is during initialization.
    if (App.people.length < 3)
      return;

    $("#scrollableContainer").animate({
      scrollLeft: personContainer.outerWidth(true),
    }, 500);
  },

  ready: function () {
    App.totalTaxAndTip = App.TotalTaxAndTip.create();
    App.totalTaxAndTip.appendTo($("body"));

    App.addPersonButton = App.AddPersonButton.create();
    App.addPersonButton.appendTo($("body"));

    App.addPerson();
    App.addPerson();
  },
});
