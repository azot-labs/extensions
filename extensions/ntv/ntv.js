'use strict';

const { defineExtension } = require('@streamyx/api');

module.exports = defineExtension({
  name: 'ntv',
  tag: 'NTV',
  fetchContentMetadata: async (url) => {
    const pageResponse = await fetch(url);
    const pageBody = await pageResponse.text();
    const videoFrameLink = pageBody
      .split(`<meta property="og:video:iframe" content="`)[1]
      ?.split(`">`)[0]
      ?.split(`" />`)[0];
    const videoId = videoFrameLink.split(`embed/`)[1]?.split(`/`)[0];
    const xmlResponse = await fetch(`https://www.ntv.ru/vi${videoId}/`);
    const xmlBody = await xmlResponse.text();
    const fileLink = xmlBody.split(`<file>`)[1]?.split(`</file>`)[0]?.split(`DATA[`)[1]?.split(`]`)[0];
    const title = xmlBody.split(`<embed_tag>`)[1]?.split(`</embed_tag>`)[0];
    const subtitlesRoute = xmlBody.split(`<subtitles>`)[1]?.split(`</subtitles>`)[0];
    const subtitlesUrl = `https://www.ntv.ru${subtitlesRoute}`;
    const hqFileLink = fileLink.replace(`vod/`, `vod/hd/`).replace(`_lo.mp4`, `.mp4`);
    console.info(`Video: ${hqFileLink}`);
    if (subtitlesRoute) console.info(`Subtitles: ${subtitlesUrl}`);
    return [{ title, source: { url: hqFileLink } }];
  },
});
