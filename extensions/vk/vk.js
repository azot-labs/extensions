'use strict';

const { defineExtension } = require('@streamyx/api');

module.exports = defineExtension({
  name: 'vk',
  tag: 'VK',
  fetchContentMetadata: async (url, args) => {
    const [ownerId, videoId] = url.split('video-')[1].split('_');

    const response = await http.fetchAsChrome('https://vkvideo.ru/al_video.php?act=show', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
        accept: '*/*',
        'accept-language': 'ru-RU,ru;q=0.9',
        'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        Referer: url,
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      body: new URLSearchParams({
        al: 1,
        autoplay: 1,
        claim: '',
        force_no_repeat: true,
        is_video_page: true,
        list: '',
        module: 'direct',
        t: '',
        video: `-${ownerId}_${videoId}`,
      }).toString(),
    });
    const data = await response.json();
    const js = data.payload.find((item) => !!item)?.find((item) => !!item.player);

    if (Number(js.mvData.is_active_live) !== 0) {
      console.error('Live videos are not supported');
      return [];
    }

    const selectedQuality = args.videoQuality?.replace('p', '').trim();
    const resolutions = ['2160', '1440', '1080', '720', '480', '360', '240', '144'];
    let quality = selectedQuality || '2160';
    for (const i in resolutions) {
      if (js.player.params[0][`url${resolutions[i]}`]) {
        quality = resolutions[i];
        break;
      }
    }
    if (selectedQuality && Number(quality) > Number(selectedQuality)) quality = selectedQuality;

    const results = [];
    const mediaUrl = js.player.params[0][`url${quality}`];
    const manifestUrl = js.player.params[0].dash_sep;
    if (!mediaUrl || !manifestUrl) {
      console.error('Could not find video URL');
      return results;
    }
    const title = js.player.params[0].md_title.trim();
    const author = js.player.params[0].md_author.trim();
    results.push({
      title: `${title} ${author}`,
      source: {
        url: manifestUrl || mediaUrl,
        headers: http.headers,
      },
    });
    return results;
  },
});
