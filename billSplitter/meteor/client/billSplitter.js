// From CSS
var screenWidth = 320;
var personMargin = 20;
var personWidth = 180;

// Cached values
var addPersonButton;
var personContainer;
var scrollableContainer;

// Map $(".Person").id -> subtotal (w/o tax and tip)
var PersonSubtotals = {};
var numPeople = 0;

var tipMultiplier = 0;

Meteor.startup(function () {

  personContainer = $("#PersonContainer");
  scrollableContainer = $("#scrollableContainer");

  personContainer.append(Meteor.ui.render(function (){
    return Template.addpersonbutton({buttonType: randomButtonType()});
  }));
  addPersonButton = $(".AddPersonButton");
  
  personContainer.width(addPersonButton.outerWidth(true));
  var firstPerson = createPerson(randomButtonType(), false);
  createPerson(randomButtonType(), false);

  bindEventHandlersToCurrencyField($("#totalInput"));
  bindEventHandlersToCurrencyField($("#taxInput"));

  // Initialize tip and bind event handlers to tip selection
  function updateTipMultiplier(e) {
    tipMultiplier = parseFloat($("#tipInput option:selected").val());
  
    if (!e)
      return;

    // Recalculate all person totals.
    $(".Person").each(function () {
      updateTotalForPerson($(this), 0);
    });
  };
  $("#tipInput").change(updateTipMultiplier);
  updateTipMultiplier();

});

var types = ["btn-primary", "btn-info", "btn-success", "btn-warning", "btn-danger"];
var currentType = Math.floor(Math.random() * types.length);
function randomButtonType() {
  // Not really random b/c random produces the same results too often =)
  currentType = ++currentType % types.length;
  return types[currentType];
}

function createPerson(additionalClasses, centerAndFocus) {
  var person = Meteor.ui.render(function () { return Template.person({additionalClasses: additionalClasses}); });
  personContainer[0].insertBefore(person, addPersonButton[0]);
  var children = personContainer.children(".Person");
  person = children.last();

  var id = "P" + (numPeople++);
  person.attr("id", id);
  PersonSubtotals[id] = 0;

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

  var item = createItemForPerson(person);

  // Randomize add button type again.
  var classList = addPersonButton[0].classList;
  addPersonButton.removeClass(classList[classList.length - 1]);
  var type = randomButtonType();
  addPersonButton.addClass(type);
  addPersonButton.attr("onclick", "createPerson('" + type + "', true)");

   if (centerAndFocus) {
    item.find(".ItemPrice").focus();
    setTimeout(function () {
      scrollableContainer.animate({
        scrollLeft: personContainer.outerWidth(true),
      }, 1000);
    }, 250);
  };

  return person;
}

function createItemForPerson(person) {
  var item = Meteor.ui.render(function () { return Template.item(); });
  var list = person.find(".ScrollableItemList");
  list.append(item);
  item = $(list[0].lastElementChild);

  var field = item.children(".ItemPrice");
  bindEventHandlersToCurrencyField(field, true);

  field.focus(function (e) {
    if (item.parent()[0].lastElementChild === item[0])
      createItemForPerson(person);
  }).blur(function (e) {
    // Remove empty fields unless they are the last field
    if (item[0] !== item.parent()[0].lastElementChild && !item.children(".ItemPrice").val())
      item.remove();
  });

  itemCountDidChangeForPerson(person);
  return item;
}

function itemCountDidChangeForPerson(person) {
  var list = person.find(".ScrollableItemList");
  var isOverflowing = list[0].scrollHeight > list.innerHeight();
  person.find(".BottomShadow").css("display", isOverflowing ? "block" : "none");
}

function bindEventHandlersToCurrencyField(field, isItemPrice) {
  function moveSelectionToEnd(element) {
    var end = element.value.length;
    element.setSelectionRange(end, end);
  }

  field.focus(function (e) {
    var fieldElement = e.target;
    if (!fieldElement.value)
      fieldElement.value = "0.00";
    moveSelectionToEnd(fieldElement);

  }).mouseup(function (e) {
    // Override WebKit's setting of position to where the mouse clicked.
    moveSelectionToEnd(e.target);

  }).blur(function (e) {
    if (!parseFloat(e.target.value))
      e.target.value = "";

  }).keypress(function (e) {
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

    if (isItemPrice)
      updateTotalForPerson($(fieldElement).closest(".Person"), value - oldValue);
  }).keydown(function (e) {
    // Override backspace so we maintain the right formatting
    if(e.keyCode !== "\b".charCodeAt(0))
      return;

    e.preventDefault();
    e.stopPropagation();

    var fieldElement = e.target;
    var oldValue = parseFloat(fieldElement.value);
    var value = Math.min(oldValue / 10);
    fieldElement.value = (value).toFixed(2);

    if (isItemPrice)
      updateTotalForPerson($(fieldElement).closest(".Person"), value - oldValue);
  });
}

function updateTotalForPerson(person, deltaTotal)
{
  var id = person[0].id;
  var newSubtotal = PersonSubtotals[id] + deltaTotal;
  PersonSubtotals[id] = newSubtotal;

  // FIXME: Add tax and tip calculation
  var tip = newSubtotal * tipMultiplier;
  $("#tipAmount")[0].innerText = tip.toFixed(2);
  
  var totalStrings = (newSubtotal + tip).toFixed(2).split(".");
  person.find(".Dollar")[0].innerText = totalStrings[0];
  person.find(".Cents")[0].innerText = totalStrings[1];
}