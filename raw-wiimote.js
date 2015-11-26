var HID = require('node-hid'),
    pakkit = require('pakkit'),
    events = require('events');

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

var Wiimote = new events.EventEmitter();

Wiimote.open = function (callback) {
  var wiimote = this,
      currentPaths = null,
      currentDevices = [];

  wiimote.on('data', callback);

  function enumerate() {
    return HID.devices().filter(isWiimote).map(function (d) {
      return d.path;
    }).sort();
  }

  function checkDevices() {
    var devicePaths = enumerate();
    if (devicePaths.join(',') !== currentPaths) {
      openAll(devicePaths);
    }
  }

  function closeAll() {
    currentDevices.forEach(function (d) {
      d.close();
    });
  }

  function openAll(devicePaths) {
    closeAll();
    currentPaths = devicePaths.join(',');

    wiimote.emit('enumerate', devicePaths.length);

    currentDevices = devicePaths.map(function(devicePath, index) {
      var device = new HID.HID(devicePath),
          ledState = 0x10 << (index % 4),
          rumble = 0;

      device.on('data', function(data) {
        data = data.slice(1);
        parsed = packets.BUTTONS.read(data);

        wiimote.emit('data', index + 1, parsed);

        if (parsed.buttons.home) {
          rumble = 1;
        } else {
          rumble = 0;
        }
        device.write(new Buffer([Command.SetLEDState, ledState | rumble]));
      });

      device.on('error', function() {
        openAll(enumerate());
      });

      device.write(new Buffer([Command.SetReportingMode, ReportFlags.OnChange, ReportMode.Buttons]));
      device.write(new Buffer([Command.SetLEDState, ledState]));

      wiimote.emit('data', index + 1, { buttons: {} });

      return device;
    });
  }

  wiimote.timer = setInterval(checkDevices, 1000);
  process.nextTick(checkDevices);
};

module.exports = Wiimote;
