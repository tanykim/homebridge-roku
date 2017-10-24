const discover = require('nodeku')
const fs = require('fs');
const path = require('path');
const deepmerge = require('deepmerge');

const HOMEBRIDGE_CONFIG = path.join(process.env.HOME, '.homebridge', 'config.json');

/**
 * Generate or merge the configuration for homebridge-roku by querying
 * roku for information and installed apps.
 * @return {Promise<Object>}
 */
function generateConfig() {
  return discover().then(device => {
    const ip = device.ip();
    const appMap = {};
    return device.apps().then(apps =>
      apps.forEach(app => appMap[app.name] = app.id))
    .then(() => device.info())
    .then(info => ({ ip, appMap, info }))
  })
  .then(({ ip, appMap, info }) => {
    const config = {
      accessories: [
        {
          accessory: "Roku",
          name: "Roku",
          ip,
          appMap,
          info,
        },
      ],
    };

    return config;
  });
}

/**
 * Merge the given config object with the existing homebridge config.
 * @param {Object} toMerge
 */
function mergeConfig(toMerge) {
  try {
    const config = JSON.parse(fs.readFileSync(HOMEBRIDGE_CONFIG));
    const merged = deepmerge(config, toMerge);
    fs.writeFileSync(JSON.stringify(merged, null, 4));
  } catch (err) {
    console.error(`There was a problem merging the config: ${err}`);
  }
}

module.exports = {
  generateConfig,
  mergeConfig,
  HOMEBRIDGE_CONFIG,
};
