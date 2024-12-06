'use strict';

const { defineExtension } = require('@streamyx/api');

module.exports = defineExtension({
  name: 'virtualroom',
  fetchContentMetadata: async (url) => {
    const recordId = new URL(url).searchParams.get('recordId');

    const infoUrl = `https://mv1.virtualroom.ru/vr/player/records/${recordId}/info`;
    const infoResponse = await fetch(infoUrl);
    const info = await infoResponse.json();

    const eventsUrl = `https://mv1.virtualroom.ru/vr/player/records/${recordId}/events`;
    const eventsResponse = await fetch(eventsUrl);
    const events = await eventsResponse.json();

    const results = [];
    for (const translation of events.data.translations) {
      const title = `${info.data.roomParameters.name} ${translation.type} ${translation.source} ${translation.start}`;
      results.push({ title, source: { url: translation.url } });
    }
    return results;
  },
});
