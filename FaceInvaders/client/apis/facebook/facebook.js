function FacebookAPI (appID) {
  this.appID = appID;
  this.loaded = false;

  // Events
  this.onStatusChange;

  // User Info
  this.id = null;
  this.status = "out";

  // All cached users
  this.users = {};
  this.friends = {};
  this.friendIDs = [];
};

FacebookAPI.prototype.loadAsync = function (callback) {
  if (this.loaded) {
    callback();
    return;
  }

  var that = this;
  window.fbAsyncInit = function() {
    FB.init({
      appId      : that.appID,
      // channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });

    this.loaded = true;
    that.watchStatus();
    callback && callback();
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
};
FacebookAPI.prototype.login = function () {
  if (this.status == "in") return;
  FB.login();
};
FacebookAPI.prototype.statusChange = function (callback) {
  this.onStatusChange = callback;
}
FacebookAPI.prototype.watchStatus = function () {
  var that = this;
  var callback = that.onStatusChange;

  function onStatus(response) {
    if (response.status === 'connected')
      that.status = "in";
    else
      that.status = "out";

    callback && callback();
  };

  FB.getLoginStatus(function(response) {
    onStatus(response); // once on page load
    FB.Event.subscribe('auth.statusChange', onStatus); // every status change
  });
};
FacebookAPI.prototype.getFriends = function (callback) {
  var base = "https://graph.facebook.com";
  var path = "/me/friends";
  var query = "?access_token=" + FB.getAccessToken();
  var url = base + path + query;

  var that = this;
  Meteor.http.get(url, function (e, r) {
    if (e) { console.log("ERROR: Get FB Friends Failed."); return;}

    var friends = JSON.parse(r.content).data;
    _.each(friends, function (f) {
      var u = that.users[f.id];
      if (u) {
        u = _.extend(u, f);
        that.users[f.id] = u;
      } else {
        that.users[f.id] = f;
      }

      if (!that.friends[f.id]) that.friendIDs.push(f.id);
      that.friends[f.id] = u;
    });

    callback && callback();
  });
};