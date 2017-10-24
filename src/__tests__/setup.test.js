const { generateConfig, mergeConfig } = require('../setup');

jest.mock('nodeku');
jest.mock('fs');

const IP = '192.168.1.1';

describe('setup', () => {

  describe('#generateConfig()', () => {

    beforeEach(() => {
      require('nodeku').__setDevice(
        IP,
        [
          { name: 'Netflix', id: '1234' },
          { name: 'Spotify', id: '4567' },
        ],
        {
          manufacturer: 'TCL',
          serialNumber: '12345',
        });
    });

    it('should return the generated config', () => {
      generateConfig().then((config) => {
        expect(config).toBeDefined();
        const { accessories } = config;
        expect(accessories).toBeInstanceOf(Array);
        expect(accessories.length).toEqual(1);
        const accessory = accessories[0];
        expect(accessory).toEqual({
          accessory: 'Roku',
          name: 'Roku',
          ip: IP,
          appMap: { Netflix: '1234', Spotify: '4567' },
          info: { manufacturer: 'TCL', serialNumber: '12345' },
        });
      });
    });

  });

  describe('#mergeConfig()', () => {

    beforeEach(() => {
      require('fs').__setReadFile(JSON.stringify({
        bridge: {
          name: 'homebridge',
        },
        description: 'test',
        accessories: [
          {
            accessory: 'test',
            name: 'test',
          },
        ],
      }));
    });

    it('should combine the existing config with the given config', () => {
      mergeConfig({
        accessories: [
          {
            accessory: 'Roku',
            name: 'Roku',
            ip: IP,
          }
        ],
      });

      const written = JSON.parse(require('fs').__getWrittenFile());
      expect(written).toEqual({
        bridge: {
          name: 'homebridge',
        },
        description: 'test',
        accessories: [
          {
            accessory: 'test',
            name: 'test',
          },
          {
            accessory: 'Roku',
            name: 'Roku',
            ip: IP,
          },
        ],
      });
    });
  });
});
