var App = {
  raf: null,
  time: (new Date()).getTime(),

  Player: null,
  Fleet: null,
  enemies: {},
  bullets: {},

  el: null, hud: null,
  w: 1440, h: 900,

  loggedIn: false,
  fbLoaded: false,
  gameInProgress: false,

  launch: function (pel) {
    // Set up DOM
    var hud = App.hud = $("<div>");
    hud.addClass("App");
    pel.append(hud);

    var el = App.el = $("<div>");
    el.addClass("World");
    hud.append(el);

    // Fit the viewport
    function resizeToViewport() {
      App.w = App.W = $(window).width();
      App.H = $(window).height();
      App.h = App.H - 80;
      hud.width(App.W);
      hud.height(App.H);
    }
    $(window).resize(resizeToViewport);
    resizeToViewport();

    // Set up inputs
    var doc = $(document);
    doc.keydown(function (e) {
      if (e.which == 32 && App.Player)
        App.Player.fire();
      if (e.which == 37 && App.Player)
        App.Player.stepLeft();
      if (e.which == 39 && App.Player)
        App.Player.stepRight();
    });
    doc.click(function () {
      if (App.fbLoaded && !App.loggedIn) {
        App.login();
      } else if (App.loggedIn && !App.gameInProgress) {
        App.loadGame(0);
      } else if (App.gameInProgress) {
        App.Player.fire();
      }
    });
    doc.mousemove(function (e) {
      App.Player && App.Player.goto(e.pageX);
    });
    doc.bind("touchmove", function (e) {
      App.Player && App.Player.goto(e.pageX);
    });

    App.Player = new Player();

    // Set up the log in to facebook button.
    var loginButton = new BalloonButton("Log In to Facebook", function () {
      if (App.fbLoaded && !App.loggedIn)
        App.login();
    });
    App.el.append(loginButton.el);
    loginButton.el.offset({
      left: (App.w - loginButton.el.outerWidth(true)) / 2,
      top: (App.h - loginButton.el.outerHeight(true)) / 2,
    });

    App.main();
  },
  loadFacebook: function () {
    window.fbAsyncInit = function() {
      FB.init({
        appId      : '485761404769776', // App ID
        // channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel File
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
      });
      App.fbLoaded = true;

      function onStatus(response) {
        if (response.status === 'connected') {
          App.loggedIn = true;
          App.Player.load();
        } else App.loggedIn = false;
      };

      FB.getLoginStatus(function(response) {
        onStatus(response); // once on page load
        FB.Event.subscribe('auth.statusChange', onStatus); // every status change
      });
    };

    // Load the SDK Asynchronously
    (function(d) {
      console.log("Async Loading Facebook API SDK");
      var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement('script'); js.id = id; js.async = true;
      js.src = "//connect.facebook.net/en_US/all.js";
      ref.parentNode.insertBefore(js, ref);
    }(document));
  },
  login: function () {
    FB.login();
  },
  logout: function () {
    FB.logout();
  },

  loadGame: function (gameID) {
    switch (gameID) {
      default:
        App.loadMap(0);
        App.createFriendFleet();
        break;
    }
    App.gameInProgress = true;
  },
  loadMap: function (mapID) {
  },
  createFriendFleet: function () {
    var base = "https://graph.facebook.com";
    var path = "/me/friends";
    var query = "?access_token=" + FB.getAccessToken();
    var url = base + path + query;

    Meteor.http.get(url, function (e, r) {
      if (e) { console.log("ERROR: Get FB Friends Failed."); return;}
      var friends = JSON.parse(r.content).data;
      App.Fleet = new Fleet(friends, 10);
    });
  },
  main: function () {
    App.raf = window.requestAnimationFrame(App.main);

    var now = (new Date()).getTime();
    var ms = now - App.time;
    App.time = now;

    App.update(ms);
    App.render();
  },
  update: function (ms) {
    App.Player && App.Player.update(ms);
    App.Fleet && App.Fleet.update(ms);

    function updateAll (L) {
      for (i in L) {
        var o = L[i];
        o && o.update(ms);
      }
    };
    updateAll(App.bullets);
  },
  render: function () {
    App.Player && App.Player.render();
    App.Fleet && App.Fleet.render();

    function renderAll (L) {
      for (i in L) {
        var o = L[i];
        o && o.render();
      }
    };
    renderAll(App.bullets);
  },
  collides: function (a, b) {
    // Currently assumes only DOM nodes' rects for collisions
    function left (x) { return x.offset().left };
    function right (x) { return left(x) + x.width(); };
    function top (x) { return x.offset().top; };
    function bottom (x) { return top(x) + x.height(); };

    return !(left(a) > right(b)
          || right(a) < left(b)
          || top(a) > bottom(b)
          || bottom(a) < top(b));
  }
};
