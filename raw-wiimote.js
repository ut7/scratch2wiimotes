var HID = require('node-hid'),
    pakkit = require('pakkit');

var Command = {
  SetLEDState: 0x11,
  SetReportingMode: 0x12
};

var ReportFlags = {
  OnChange: 0x00,
  Continuous: 0x04
};

var ReportMode = {
  Buttons: 0x30,
  ButtonsAccelerometer: 0x31
};

function isWiimote(deviceDesc) {
  return deviceDesc.product.match(/Nintendo/);
}

var packets = pakkit.export({
  BUTTONS : {
    buttons: {
      mask: [
        'dleft', 'dright', 'ddown', 'dup',
        'plus', '_', '_', '_',
        '2', '1', 'b', 'a',
        'minus', '_', '_', 'home'
      ],
      type: 'uint16le'
    }
  }
}, {});

exports.open = function (callback) {
  var deviceDescs = HID.devices().filter(isWiimote).sort(function (a, b) {
    return a.path.localeCompare(b.path);
  });

  deviceDescs.forEach(function(deviceDesc, index) {
    var device = new HID.HID(deviceDesc.path);

    var ledState = 0x10 << index;
    var rumble = 0;

    device.on('data', function(data) {
      data = data.slice(1);
      parsed = packets.BUTTONS.read(data);
      callback(index + 1, parsed);

      if (parsed.buttons.home) {
        rumble = 1;
      } else {
        rumble = 0;
      }
      device.write(new Buffer([Command.SetLEDState, ledState | rumble]));
    });

    device.write(new Buffer([Command.SetReportingMode, ReportFlags.OnChange, ReportMode.Buttons]));
  });
};
