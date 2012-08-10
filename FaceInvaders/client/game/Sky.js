var cloudClasses = ["Bacon1", "Bacon2", "Egg1", "Egg2"];
var cloudDuration = 50000;

function createCloud (container, delay) {
  var c = container;
  var el = $("<div>");
  el.addClass(cloudClasses[Math.floor(Math.random() * cloudClasses.length)]);

  if (delay === undefined)
    delay = Math.random() * cloudDuration;
  var duration = Math.random() * cloudDuration + cloudDuration;
  c.append(el);
  
  setTimeout(function () {
    el.css({
      "left": "100%",
      "top": Math.floor(Math.random() * 100) - 10 + "%",
      "-webkit-transition-duration": duration / 1000 + "s",
    });

    setTimeout(function () {
      el.remove();
      createCloud(c, 0);
    }, duration);
  }, delay);
}

var twinkleDuration = 5;
var starClasses = ["RedStar", "YellowStar", "YellowDot", "PinkDot", "BlueStar", "SeptStar"];
function createNightSky (container, numberOfStars) {
  var sky = $("<div class='NightContainer'>");
  sky.append($("<div class='Moon'>"));

  for (var i = 0; i < numberOfStars; i++) {
    var star = $("<div>");
    star.addClass(starClasses[Math.floor(Math.random() * starClasses.length)]);
    star.css({
      left: Math.floor(Math.random() * 100) -10 + "%",
      top: Math.floor(Math.random() * 75) + "%",
      "-webkit-animation-delay": Math.random() * twinkleDuration + "s",
    });
    sky.append(star);
  }

  container.append(sky);
}