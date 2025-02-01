'use strict';

const { defineExtension } = require('@streamyx/api');

// Widevine examples: https://kinescope.io/200660125, https://kinescope.io/201265440
// ClearKey examples: https://kinescope.io/embed/202544377, https://kinescope.io/201268665

module.exports = defineExtension({
  name: 'kinescope',
  fetchContentMetadata: async (url) => {
    const response = await fetch(url);
    const data = await response.text();

    const title = data.split('<title>')[1]?.split('</title>')[0];
    const playerOptionsString = data.split('playerOptions = ')[1]?.split('};')[0] + '}';
    const playerOptions = eval(`(${playerOptionsString})`);
    const playlist = playerOptions.playlist[0];
    const manifestUrl = playlist.sources.shakadash?.src;

    const drm = {};
    const clearkey = playlist.drm.clearkey;
    const widevine = playlist.drm.widevine;
    if (widevine) {
      drm.server = widevine.licenseUrl;
    } else if (clearkey) {
      const licenseUrl = clearkey.licenseUrl;
      const manifest = await fetch(manifestUrl).then((r) => r.text());
      const kid = manifest.split('default_KID="')[1]?.split('"')[0]?.replaceAll('-', '');
      const encodedKid = Buffer.from(kid, 'hex').toString('base64').replaceAll('=', '');
      const response = await fetch(licenseUrl, {
        method: 'POST',
        headers: { Referer: 'https://kinescope.io/' },
        body: JSON.stringify({ kids: [encodedKid], type: 'temporary' }),
      }).then((r) => r.json());
      const encodedKey = response['keys'][0]['k'];
      const key = Buffer.from(encodedKey + '==', 'base64').toString('hex');
      drm.keys = [{ kid, key }];
    }

    return [{ title, source: { url: manifestUrl, drm } }];
  },
});
