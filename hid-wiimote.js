var HID = require('node-hid');

var pakkit = require('pakkit');

var packets = pakkit.export({
  WIIMOTE_CONTROLLER : {
    buttons: {
      mask: [
        'dleft', 'dright', 'dup', 'ddown', 'a', 'trigger',
        'plus', 'minus', 'home',
        '1', '2',
        'z', 'c'
      ],
      type: 'uint32le'
    },
    left: {
      type: 'joystick'
    }
  }
}, {
  joystick: {
    read: function(parser, attribute) {
      parser
        .int8(attribute.name + 'X')
        .int8(attribute.name + 'Y')
        .tap(function() {
          this.vars[attribute.name] = {
            x: this.vars[attribute.name + 'X'],
            y: this.vars[attribute.name + 'Y'] * -1
          };
          delete(this.vars[attribute.name + 'X']);
          delete(this.vars[attribute.name + 'Y']);
        });
    }
  }
});

exports.open = function (cb) {
  var wiimoteNumber = 1;
  HID.devices().slice().sort(function(d1, d2) {
    return (d1.path > d2.path) ? 1 : ((d1.path < d2.path) ? -1 : 0);
  }).forEach((function(d) {
    if(d && d.product.toLowerCase().indexOf('wiimote') !== -1) {
      console.log('Found a wiimote', d);
      var thisWiimote = wiimoteNumber;
      var hid = new HID.HID(d.path);

      var read = function(error, data) {
        var packet = packets.WIIMOTE_CONTROLLER.read(data);

        cb(thisWiimote, packets.WIIMOTE_CONTROLLER.read(data));

        hid.read(read);
      };

      hid.read(read);
      wiimoteNumber += 1;
    }
  }))
};

