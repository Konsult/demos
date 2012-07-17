// From CSS
var screenWidth = 320;
var personMargin = 20;
var personWidth = 180;

Meteor.startup(function () {
  createPerson();
  createPerson();
});

function createPerson() {
  var person = Meteor.ui.render(function () { return Template.person(); });
  var personContainer = $("#PersonContainer");
  personContainer[0].insertBefore(person, personContainer.children(".AddPersonCard")[0]);
  person = personContainer.children().last().prev();

  var list = person.find(".ScrollableItemList");
  list.scroll(function(e) {
    var list = $(e.delegateTarget);

    var isTopClipped = list.scrollTop() > 0;
    person.find(".TopShadow").css("display", isTopClipped ? "block" : "none");

    var lastChild = $(list[0].lastElementChild);
    var isBottomClipped = list.innerHeight() < lastChild.position().top + lastChild.outerHeight();
    person.find(".BottomShadow").css("display", isBottomClipped ? "block": "none");
  });

  itemCountDidChangeForPerson(person);
  var numChildren = personContainer.children().length;
  personContainer.width(numChildren * (personWidth + 2 * personMargin) - 2 * personMargin);

  createItemForPerson(person);
  createItemForPerson(person);
}

function createItemForPerson(person) {
  var item = Meteor.ui.render(function () { return Template.item(); });
  var list = person.find(".ScrollableItemList");
  list.append(item);
  item = $(list[0].lastElementChild);

  item.children(".ItemPrice").focus(function (e) {
    if (item.parent()[0].lastElementChild === item[0])
      createItemForPerson(person);
  }).blur(function (e) {
    if (item.parent()[0].childElementCount < 3)
      return;
    if (item.next()[0] === item.parent()[0].lastElementChild && !item.children(".ItemPrice").val())
      item.next().remove();
  });

  itemCountDidChangeForPerson(person);
}

function itemCountDidChangeForPerson(person) {
  var list = person.find(".ScrollableItemList");
  var isOverflowing = list[0].scrollHeight > list.innerHeight();
  person.find(".BottomShadow").css("display", isOverflowing ? "block" : "none");
}