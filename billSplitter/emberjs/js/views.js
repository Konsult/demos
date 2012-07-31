// FIXME: Break this out so it's a reusable component.
App.CurrencyInput = Em.TextField.extend({
  classNames: ["CurrencyInput"],
  attributeBindings: ["name", "pattern"],
  type: "text",
  pattern: "[0-9]*",

  maxLength: 0, // This can be overriden by subclasses. 0 = no max length.

  focusIn: function (e) {
    var fieldElement = e.target;
    if (!fieldElement.value)
      fieldElement.value = "0.00";
    this.moveSelectionToEnd(fieldElement);
  },

  focusOut: function (e) {
    if (!parseFloat(e.target.value))
      e.target.value = "";
  },

  keyPress: function (e) {
    var value = String.fromCharCode(e.charCode);

    if (!value)
      return;

    e.preventDefault();
    e.stopPropagation();

    value = parseInt(value);
    if (isNaN(value))
      return;

    var fieldElement = e.target;

    // Prevent exceeding the max length.
    var maxLength = this.get("maxLength");
    if (maxLength && fieldElement.value.length >= maxLength)
      return;

    // Compute new value
    var oldValue = parseFloat(fieldElement.value);
    if (isNaN(oldValue))
      oldValue = 0;
    value = parseFloat(oldValue) * 10 + value / 100;
    fieldElement.value = value.toFixed(2);
  },

  keyDown: function (e) {
    // Override backspace so we maintain the right formatting
    if(e.keyCode !== "\b".charCodeAt(0))
      return;

    e.preventDefault();
    e.stopPropagation();

    var fieldElement = e.target;
    var oldValue = parseFloat(fieldElement.value);
    // Round down to the 2nd decimal place
    fieldElement.value = Math.max(oldValue / 10 - 0.004, 0).toFixed(2);
  },

  mouseUp: function (e) {
    // Override WebKit's setting of position to where the mouse clicked.
    this.moveSelectionToEnd(e.target);
  },

  moveSelectionToEnd: function (element) {
    var end = element.value.length;
    element.setSelectionRange(end, end);
  },
});

App.AddPersonButton = Em.View.extend({
  templateName: "add-person-button",
  classNames: ["AddPersonButton", "btn"],

  click: function (e) {
    App.addPerson();
  },
});

App.TotalTaxAndTip = Em.View.extend({
  templateName: "total-tax-and-tip",

  tipView: null,
  totalView: null,
  taxView: null,

  tip: function () {
    var view = this.get("tipView");
    if (!view)
      return 0;

    var selection = view.get("selection");
    if (!selection)
      return 0;
    return selection.value;
  }.property("tipView.selection"),

  tax: function () {
    var view = this.get("taxView");
    if (!view)
      return 0;
    var tax = parseFloat(view.get("value"));
    if (isNaN(tax))
      return 0;
    return tax;
  }.property("taxView.value"),

  total: function () {
    var view = this.get("totalView");
    if (!view)
      return 0;
    var total = parseFloat(view.get("value"));
    if (isNaN(total))
      return 0;
    return total;
  }.property("totalView.value"),

  taxPercentage: function () {
    var total = this.get("total");
    if (!total)
      return NaN;
    return this.get("tax") / total;
  }.property("tax, total"),

  createChildView: function (viewClass, attrs) {
    var view = this._super(viewClass, attrs);
    var name = view.get("name");
    if (name === "total")
      this.set("totalView", view);
    else if (name === "tip")
      this.set("tipView", view);
    else if (name === "tax")
      this.set("taxView", view);

    return view;
  },
});

App.TipSelect = Em.Select.extend({
  attributeBindings: ["name"],
  content: Em.A([
      { name: "0%", value: 0, },
      { name: "5%", value: 0.05, },
      { name: "10%", value: 0.1, },
      { name: "15%", value: 0.15, },
      { name: "17%", value: 0.17, },
      { name: "20%", value: 0.20, },
      { name: "25%", value: 0.25, },
    ]),
  optionLabelPath: "content.name",
  optionValuePath: "content.value",

  didInsertElement: function () {
    this.$().find("option[value='0.15']").attr("selected", "selected");
  },
});

App.PersonView = Em.View.extend({
  templateName: "person",
  classNames:["Person"],

  id: null, // Will be set by constructor.
  person: null, // Will be bound when view is inserted.

  totalAmount: function () {
    var person = this.get("person");
    if (!person)
      return "0.00";

    var tip = person.get("tip");
    var subtotal = person.get("totalWithoutTaxOrTip");
    var tax = person.get("tax");
    return (tip + subtotal + tax).toFixed(2);
  }.property("person.totalWithoutTaxOrTip", "person.tip", "person.tax"),

  personTotalClass: function() {
    var totalDollar = this.get("totalDollar");
    if (totalDollar && totalDollar.length > 3)
      return "PersonTotal Small";
    return "PersonTotal Big";
  }.property("totalDollar"),

  totalDollar: function () {
    return this.get("totalAmount").split(".")[0];
  }.property("totalAmount"),
  totalCents: function () {
    return this.get("totalAmount").split(".")[1];
  }.property("totalAmount"),

  personChanged: function () {
    this.get("person").set("view", this);
  }.observes("person"),

  didInsertElement: function () {
    App.addedPersonView(this);
  },
});

App.ItemView = App.CurrencyInput.extend({
  classNames: ["ItemPrice"],
  name: "itemPrice",
  placeholder: "+",
  maxLength: 7,

  item: null, // Will be bound when view is inserted

  itemChanged: function () {
    this.get("item").set("view", this);
  }.observes("item"),

  focusIn: function (e) {
    this._super(e);
    this.get("item").focusIn(e);
  },

  focusOut: function (e) {
      this.get("item").focusOut(e);
  },
});

App.DraggableItemViewPreview = App.ItemView.extend({
  originalView: null, // DraggableItemView. Set on creation.
  classNames: ["DraggedView"],
  value: "Drop to share",

  didInsertElement: function () {
    this._super();

    var jElement = this.$();
    jElement.css("background-color", this.get("originalView").$().css("background-color"));

    var root = $(App.rootElement);
    var originalView = this.get("originalView");
    var data = this.get("originalView").constructEventData();
    root.on("vmousecancel", data, originalView.cancelDrag);
    root.on("vmouseup", data, originalView.finishDrag);
    root.on("vmousemove", data, this.continueDrag);
    root.one("taphold", "#" + jElement.attr("id"), data, this.continueDrag);
  },

  continueDrag: function (jEvent) {
    var myJView = jEvent.data.draggableItemView.get("draggedView").$();
    myJView.css("left", jEvent.pageX - myJView.width() / 2);
    myJView.css("top", jEvent.pageY - myJView.height());
    myJView.css("display", "block");

    debug("continueDrag:" + jEvent.pageX + ", " + jEvent.pageY);
  
    jEvent.preventDefault();
    jEvent.stopPropagation();
  }.observes("originalView.lastMouseX", "originalView.lastMouseY"),

  removeFromParent: function () {
    this._super();

    var root = $(App.rootElement);
    var originalView = this.get("originalView");
    root.off("vmousecancel", originalView.cancelDrag);
    root.off("vmouseup", originalView.finishDrag);
    root.off("vmousemove", this.continueDrag);
    root.off("taphold", this.continueDrag);
  },
});

App.DraggableItemView = App.ItemView.extend({
  initializedMobileEventListeners: false,
  moveToDrag: false,
  draggedView: null, // DraggableItemViewPreview, Only non-null during a drag.
  lastMouseX: 0,
  lastMouseY: 0,

  constructEventData: function () {
    return {draggableItemView: this};
  },

  focusIn: function (e) {
    if (this.get("moveToDrag"))
      this.cancelDrag();

    if (!this.get("initializedMobileEventListeners")) {
      // FIXME: Technically this should be didInsertElement, but for some reason
      // didInsertElement never gets called.
      
      // This is really hackish, b/c I have to convert the jQuery events
      // in these handlers back into Ember objects. Is there a better way to do this?
      this.$().on("vmousedown", this.constructEventData(), this.prepareToDrag);
      this.set("initializedMobileEventListeners", true);
    }
    return this._super(e);
  },

  prepareToDrag: function (jEvent) {
    var self = jEvent.data.draggableItemView;
    
    // No point in dragging empty items.
    if (!parseFloat(self.get("value")))
      return;

    var data = self.constructEventData();
    var view = self.$();
    view.one("vmousemove", data, self.startDrag);
    view.one("vmouseup", data, self.pressed);
    view.one("vmousecancel", data, self.cancelDrag);

    self.set("moveToDrag", true);

    jEvent.preventDefault();
    jEvent.stopPropagation();
  },

  pressed: function (jEvent) {
    var self = jEvent.data.draggableItemView;
    self.$().focus();
  },

  startDrag: function (jEvent) {
      var self = jEvent.data.draggableItemView;
      if (!self.get("moveToDrag") || self.get("draggedView"))
        return;

    draggedView = App.DraggableItemViewPreview.create({
      originalView: self,
    });

    self.set("draggedView", draggedView);
    draggedView.appendTo($(App.rootElement));

    // If we started dragging, then that means it can't be a press.
    self.$().off("vmouseup", self.pressed);
    debug("startDrag");
  },

  finishDrag: function (jEvent) {
    var self = jEvent.data.draggableItemView;
    self.cleanupDrag();
    debug("finishDrag");
  },

  cancelDrag: function (jEvent) {
    var self = jEvent ? jEvent.data.draggableItemView : this;

    if (!self.get("moveToDrag"))
      return;

    // Prevent the input element from canceling its own drag on iOS.
    if (jEvent && jEvent.target && $(jEvent.target).is("input"))
      return;

    self.cleanupDrag();

    debug("cancelDrag");
  },

  cleanupDrag: function() {
    var view = this.$();
    view.off("vmousemove", this.startDrag);
    view.off("vmouseup", this.pressed);
    view.off("vmousecancel", this.cancelDrag);

    var draggedView = this.get("draggedView");
    if (draggedView) {
      draggedView.removeFromParent();
      this.set("moveToDrag", false);
      this.set("draggedView", null);
    }

    debug("cleanupDrag");
  }
});