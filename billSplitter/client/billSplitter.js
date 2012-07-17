// From CSS
var screenWidth = 320;
var personMargin = 20;
var personWidth = 180;

// Cached values
var addPersonButton;
var personContainer;

Meteor.startup(function () {

  personContainer = $("#PersonContainer");
  personContainer.append(Meteor.ui.render(function (){
    return Template.addpersonbutton({buttonType: randomButtonType()});
  }));
  addPersonButton = $(".AddPersonButton");
  personContainer.width(addPersonButton.outerWidth(true));
  createPerson(randomButtonType());
  createPerson(randomButtonType());
});

var types = ["btn-primary", "btn-info", "btn-success", "btn-warning", "btn-danger"];
var currentType = Math.floor(Math.random() * types.length);
function randomButtonType() {
  // Not really random b/c random produces the same results too often =)
  currentType = ++currentType % types.length;
  return types[currentType];
}

function createPerson(additionalClasses) {
  var person = Meteor.ui.render(function () { return Template.person({additionalClasses: additionalClasses}); });
  // var personContainer = $("#PersonContainer");
  personContainer[0].insertBefore(person, addPersonButton[0]);
  var children = personContainer.children(".Person");
  person = children.last();

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
  var numChildren = children.length;
  personContainer.width(personContainer.width() + person.outerWidth(true));

  createItemForPerson(person);
  var item = createItemForPerson(person);

  // Randomize add button type again.
  var classList = addPersonButton[0].classList;
  addPersonButton.removeClass(classList[classList.length - 1]);
  var type = randomButtonType();
  addPersonButton.addClass(type);
  addPersonButton.attr("onclick", "createPerson('" + type + "')");

  item.find("ItemPrice").focus();

  return person;
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
  return item;
}

function itemCountDidChangeForPerson(person) {
  var list = person.find(".ScrollableItemList");
  var isOverflowing = list[0].scrollHeight > list.innerHeight();
  person.find(".BottomShadow").css("display", isOverflowing ? "block" : "none");
}