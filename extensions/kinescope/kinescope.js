'use strict';

const { defineExtension } = require('@streamyx/api');

/**
 * Widevine example on a third-party service:
 * Page: https://nd.umschool.net/lesson/38700
 * Command: streamyx 'https://kinescope.io/2najSKQJAUAAdJQXqdN6xG?v=2.150.1&enableIframeApi&playerId=video_frame_https_kinescope_io_2_naj_skqjaua_ad_jq_xqd_n_6_x_g&size%5Bwidth%5D=100%25&size%5Bheight%5D=100%25&behaviour%5BautoPlay%5D==true' -H 'referer: https://nd.umschool.net/'
 *
 * Widevine examples:
 * Command: streamyx https://kinescope.io/200660125
 * Command: streamyx https://kinescope.io/201265440
 *
 * ClearKey examples:
 * Command: streamyx https://kinescope.io/201268665
 * Command: streamyx https://kinescope.io/embed/202544377
 */

module.exports = defineExtension({
  name: 'kinescope',
  fetchContentMetadata: async (url, args) => {
    const headers = args.header;
    const response = await fetch(url, { headers });
    const data = await response.text();

    const title = data.split('<title>')[1]?.split('</title>')[0];
    const playerOptionsString = data.split('playerOptions = ')[1]?.split('};')[0] + '}';
    const playerOptions = eval(`(${playerOptionsString})`);
    const playlist = playerOptions.playlist[0];
    const manifestUrl = playlist.sources.shakadash?.src || playlist.sources.shakahls;

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
