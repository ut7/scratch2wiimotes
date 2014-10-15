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
  HID.devices().forEach((function(d) {
    if(d && d.product.toLowerCase().indexOf('wiimote') !== -1) {
      console.log('Found a wiimote', d);
      var hid = new HID.HID(d.path);

      var read = function(error, data) {
        var packet = packets.WIIMOTE_CONTROLLER.read(data);

        cb(packets.WIIMOTE_CONTROLLER.read(data));

        hid.read(read);
      };

      hid.read(read);
    }
  }))
};

