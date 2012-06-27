function randomizeRotation(element, minDegree, maxDegree)
{
  if (minDegree == undefined)
    minDegree = 0;
  if (maxDegree == undefined)
    maxDegree = 360;

  var rotation = Math.random() * (maxDegree - minDegree) + minDegree;

  // FIXME: Support other flavors of transforms.
  element.style.webkitTransform = element.style.webkitTransform.replace(/(\s*rotate\([^\)]+\))|$/, "rotate(" + rotation + "deg)");
  if (!element.style.webkitTransformOrigin)
    element.style.webkitTransformOrigin = "center";
}

Meteor.startup(function () {
  $("#rotate").click(function () { randomizeRotation(this); });
});