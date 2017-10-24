const Roku = require('nodeku/lib/device');
const Keys = require('nodeku/lib/keys');

let Service, Characteristic;

module.exports = homebridge => {
  console.log(`homebridge API version: ${homebridge.version}`);

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  Object.entries(getAccessories()).forEach(([name, accessory]) => {
    homebridge.registerAccessory('homebridge-roku', `Roku${name}`, accessory);
  });
};

function getAccessories() {
  return {
    Power: RokuPower,
    Volume: RokuVolume,
  };
}

class RokuAccessory {
  constructor(log, config) {
    this.log = log;
    this.name = config['name'];

    if (!config.ip) {
      throw new Error(`An ip address is required for plugin ${this.name}`);
    }

    this.appMap = config.appMap;
    this.info = config.info;
    this.roku = new Roku(config.ip);

    const info = this.setupAccessoryInfo();
    const service = this.setupService();
    this.services = [info, service];
  }

  setupAccessoryInfo() {
    const accessoryInfo = new Service.AccessoryInformation();

    accessoryInfo
      .setCharacteristic(Characteristic.Manufacturer, this.info['vendor-name'])
      .setCharacteristic(Characteristic.Model, this.info['model-name'])
      .setCharacteristic(Characteristic.Name, this.info['user-device-name'])
      .setCharacteristic(Characteristic.SerialNumber, this.info['serial-number']);

    return accessoryInfo;
  }

  getServices() {
    return this.services;
  }
}

class RokuPower extends RokuAccessory {
  constructor(...args) {
    super(...args);
    this.poweredOn = false;
  }

  setupService() {
    const switch_ = new Service.Switch(this.name);

    switch_
      .getCharacteristic(Characteristic.On)
      .on('get', callback => callback(null, this.poweredOn))
      .on('set', (value, callback) => {
        this.poweredOn = value;
        this.roku.keypress(Keys.POWER)
          .then(() => callback(null))
          .catch(callback);
      });

    return switch_;
  }
}

class RokuVolume extends RokuAccessory {
  constructor(...args) {
    super(...args);
    this.muted = false;
    this.volumeLevel = 50;
  }

  setupService() {
    const volume = new Service.Speaker(this.name);

    volume
      .getCharacteristic(Characteristic.Mute)
      .on('get', callabck => callback(null, this.muted))
      .on('set', (value, callback) => {
        this.muted = value;
        this.roku.keypress(Keys.VOLUME_DOWN)
          .then(() => this.roku.keypress(Keys.VOLUME_UP))
          .then(() => {
            if (this.muted) {
              return this.roku.keypress(Keys.VOLUME_MUTE);
            }
          })
          .then(() => callback(null))
          .catch(callback);
      });

    volume
      .addCharacteristic(Characteristic.Volume)
      .on('get', callback => callback(null, this.volumeLevel))
      .on('set', (value, callback) => {
        this.log('requested volume level %d, current level %d',
          value, this.volumeLevel);
        let change = value - this.volumeLevel;
        this.volumeLevel = value;
        if (change === 0) {
          return;
        }
        let button = 'VolumeUp';
        if (change < 0) {
          button = 'VolumeDown';
        }
        change = Math.abs(change);

        this.log('sending %s %d times', button, change);

        let promise = Promise.resolve();
        for (let i = 0; i < change; ++i) {
          promise = promise.then(() => this.roku.keypress(button));
        }
        promise.then(() => callback(null))
          .catch(callback);
      });

    return volume;
  }
}
