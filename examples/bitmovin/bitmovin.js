'use strict';

const { defineExtension } = require('@streamyx/api');

// Only CommonJS syntax modules is compatible with Azot at this time
// `defineExtension` is just a wrapper for type checking, you can export extension directly as an object if you want

module.exports = defineExtension({
  name: 'bitmovin',
  fetchContentMetadata: async (url) => {
    const response = await fetch(url);
    const body = await response.text();
    if (!body.includes('.mpd')) {
      console.error(`No MPD found in ${url}`);
      return [];
    }
    const mpd = body.split(`'`).find((line) => line.includes('.mpd'));
    const title = mpd.split('/').pop().replace('.mpd', '');
    return [
      {
        title,
        source: {
          url: mpd,
          drm: { server: 'https://cwip-shaka-proxy.appspot.com/no_auth' },
        },
      },
    ];
  },
});
