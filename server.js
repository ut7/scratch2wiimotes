var express = require('express');
var wiimote = require('./hid-wiimote');
var app = express();

var wiimoteStatus = [];

wiimote.open(function (wiimoteNumber, wiimoteData) {
  wiimoteStatus[wiimoteNumber] = wiimoteData;
  console.log(wiimoteStatus);
});

app.use(function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
});

app.get('/poll', function(req, res) {
  var statuses = [];
  for(var i=1; i<=4; i++) {
    var status = wiimoteStatus[i];
    var buttons = (status && status.buttons) || {};
    ['a','trigger',
     'dleft','dright','dup','ddown',
     'plus','minus','1','2','home'].forEach(function (btn) {
      statuses.push(btn + '/' + i + ' ' + !!buttons[btn]);
    });
  }
  statuses.push('');
  res.send(statuses.join('\n'));
});

app.get('/reset_all', function(req, res) {
  console.log('reset_all');
  res.send('\n');
});

app.get('/crossdomain.xml', function (req, res) {
  res.setHeader('Content-Type', 'application/xml');
  res.send('<cross-domain-policy><site-control permitted-cross-domain-policies="all"/> <allow-access-from domain="*" to-ports="*"/></cross-domain-policy>');
});

app.get('*', function (req, res) {
  console.log(req.method + ' ' + req.url);
  res.send('unknown\n');
});

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
