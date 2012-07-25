var App = Em.Application.create({
  // Array of type App.Person
  people: [],
  totalTaxAndTip: null,

  addPerson: function () {
    var person = App.Person.create();
    person.addItem();
    App.get("people").pushObject(person);
  },

  ready: function () {
    App.totalTaxAndTip = App.TotalTaxAndTip.create({
      templateName: "total-tax-and-tip",
    });
    App.totalTaxAndTip.appendTo($("body"));

    App.addPerson();
  },
});
