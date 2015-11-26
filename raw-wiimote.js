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

var Wiimotes = new events.EventEmitter();

Wiimotes.open = function (callback) {
  var wiimotes = this,
      currentPaths = null,
      currentDevices = [];

  if (callback) {
    wiimotes.on('data', callback);
  }

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

    wiimotes.emit('enumerate', devicePaths.length);

    currentDevices = devicePaths.map(function(devicePath, index) {
      var device = new HID.HID(devicePath),
          ledState = 0x10 << (index % 4),
          rumblePulse = false,
          rumbleTimer = null;

      function applyLedAndRumble() {
        var rumbleBit = rumblePulse ? 1 : 0;
        try {
          device.write(new Buffer([Command.SetLEDState, ledState | rumbleBit]));
        } catch(e) {
          console.log(e);
        }
      }

      function pulseRumble(duration) {
        clearTimeout(rumbleTimer);
        rumblePulse = true;
        applyLedAndRumble();
        rumbleTimer = setTimeout(function () {
          rumblePulse = false;
          applyLedAndRumble();
        }, duration);
      }

      device.on('data', function(data) {
        data = data.slice(1);
        var parsed = packets.BUTTONS.read(data);

        wiimotes.emit('data', index + 1, parsed);

        if (parsed.buttons.home) {
          pulseRumble(100);
        }

        applyLedAndRumble();
      });

      device.on('error', function() {
        openAll(enumerate());
      });

      device.write(new Buffer([Command.SetReportingMode, ReportFlags.OnChange, ReportMode.Buttons]));

      pulseRumble(300);

      wiimotes.emit('data', index + 1, { buttons: {} });

      return device;
    });
  }

  wiimotes.timer = setInterval(checkDevices, 1000);
  process.nextTick(checkDevices);
};

module.exports = Wiimotes;
