var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var request = require('request');

var onlineUsers = 0;
var visitorCount = {};

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/v1/stats', function(req, res) {
  var payload = {
    online_users: onlineUsers,
    visitor_count: visitorCount
  };

  res.json(payload);
});

io.on('connection', function(socket) {
  ++onlineUsers;

  var today = new Date().toJSON().slice(0,10);
  var todayData = visitorCount[today];

  if (todayData != undefined) {
    visitorCount[today].count++;
  } else {
    visitorCount[today] = {
      count: 1
    };
  }

  socket.on('location', function(data) {
    fetchGoboxDrivers(data, socket);
  });

  socket.on('disconnect', function() {
    --onlineUsers;
  });
});

function fetchGoboxDrivers(data, socket) {
  for (var i = 1; i <= 4; ++i) {
    var baseURL = 'https://gobox-api.gojek.co.id/v1/boxes/'+i+'/vehicles/available?';
    var lat = data.lat.toFixed(6);
    var lng = data.lng.toFixed(6);
    var requestURL = baseURL + 'lat=' + lat + '&long=' + lng;

    request({
      'rejectUnauthorized': false,
      'url': requestURL
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        socket.emit('drivers', JSON.parse(response.body));
      };
    });
  }
}

http.listen(5000, function() {
  console.log('listening on *:5000');
});
