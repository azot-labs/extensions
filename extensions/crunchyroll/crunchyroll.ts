import type { ContentMetadata, ContentSource, DrmConfig, Options } from '@streamyx/api';
import { defineExtension } from '@streamyx/api';
import { ROUTES, USER_AGENT } from './lib/constants';
import { signIn, updateAuthorizationHeader } from './lib/auth';
import {
  fetchEpisodes,
  fetchObject,
  fetchPlayback,
  fetchPlayData,
  fetchSeriesSeasons,
  revokePlayData,
} from './lib/api';

const buildDrmRequestOptions = (assetId: string, accountId: string) => ({
  method: 'POST',
  body: JSON.stringify({
    user_id: accountId,
    session_id: Math.floor(Math.random() * 100000000000000).toString(),
    asset_id: assetId,
    accounting_id: 'crunchyroll',
  }),
});

const init = () => signIn();

const getDrmConfig = async (assetId: string): Promise<DrmConfig> => {
  const options = buildDrmRequestOptions(assetId, localStorage.getItem('accountId') || '');
  const response = await fetch(ROUTES.drm, options);
  const data: any = await response.json();
  return {
    server: `https://lic.drmtoday.com/license-proxy-widevine/cenc/`,
    headers: {
      'dt-custom-data': data.custom_data,
      'x-dt-auth-token': data.token,
    },
  };
};

const sanitizeString = (value: string) => {
  return value?.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, '');
};

const filterSeasonVersionsByAudio = (versions: any, selectedAudioLangs: string[] = []) => {
  const matchLang = (version: any) => selectedAudioLangs.some((lang) => version.audio_locale.startsWith(lang));
  const matchOriginal = (version: any) => !!version.original;
  const result = selectedAudioLangs.length ? versions.find(matchLang) : versions.find(matchOriginal) || versions[0];
  return result;
};

const getAudioLocales = (versions: any) =>
  versions
    .map((v: any) => v.audio_locale)
    .join(', ')
    .trim();

const getEpisodeMetadata = async (episodeId: string, _args: Options): Promise<ContentMetadata> => {
  const object = await fetchObject(episodeId);
  const isError = object.__class__ === 'error';
  if (isError) {
    const response = await fetch('https://api.country.is').catch(() => null);
    const { ip, country } = await response?.json();
    console.info(`IP: ${ip}. Country: ${country}`);
    throw new Error(`Episode ${episodeId} not found. Code: ${object.code}. Type: ${object.type}. `);
  }
  const episode = object.items[0];
  const rawMetadata = episode.episode_metadata;

  const isMovie = !rawMetadata.episode_number;
  if (isMovie) {
    return {
      id: episode.id,
      title: sanitizeString(rawMetadata.series_title),
    };
  } else {
    return {
      id: episode.id,
      title: sanitizeString(rawMetadata.series_title),
      seasonNumber: rawMetadata.season_number,
      episodeNumber: rawMetadata.episode_number,
      episodeTitle: sanitizeString(episode.title),
    };
  }
};

const getEpisodeSource = async (episodeId: string, args: Options) => {
  const play = await fetchPlayback(episodeId);

  if (play.error === 'TOO_MANY_ACTIVE_STREAMS') {
    console.warn(`Too many active streams. Revoking all active streams...`);
    for (const activeStream of play.activeStreams) {
      await revokePlayData(activeStream.contentId, activeStream.token);
    }
  }

  const subtitles: any[] = [];
  for (const subtitle of Object.values(play.subtitles) as any[]) {
    const containsSelectedSubtitles =
      !args.subtitleLanguages?.length ||
      args.subtitleLanguages?.some((lang: string) => subtitle.language.startsWith(lang));
    if (!containsSelectedSubtitles) continue;
    subtitles.push({
      url: subtitle.url,
      language: subtitle.language,
      format: subtitle.format,
    });
  }

  let data = play;
  if (play.versions) {
    const defaultVersion = { audio_locale: play.audioLocale, guid: episodeId };
    const versions = [defaultVersion, ...play.versions];
    const version = filterSeasonVersionsByAudio(versions, args.languages);
    if (!version) {
      console.warn(
        `No suitable version found for episode #${episodeId}. Available audio: ${getAudioLocales(versions)}`
      );
    } else if (version.guid !== episodeId) {
      data = await fetchPlayData(version.guid);
    }
  }

  if (args.hardsub) {
    let url: string = '';
    for (const hardsub of Object.values(data.hardSubs) as any[]) {
      const matchHardsubLang =
        !args.subtitleLanguages?.length || args.subtitleLanguages?.some((lang: string) => hardsub.hlang.includes(lang));
      if (matchHardsubLang) url = hardsub.url;
    }
    if (!url) console.warn(`No suitable hardsub stream found`);
    else data.url = url;
  }

  const url = data.url;
  const audioType = data.audioLocale?.slice(0, 2).toLowerCase();
  const assetId = url.split('assets/p/')[1]?.split('_,')[0] || data.assetId;

  const mediaInfo: ContentSource = {
    url,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'User-Agent': USER_AGENT,
    },
    drm: {
      server: ROUTES.widevine,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'User-Agent': USER_AGENT,
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        'content-type': 'application/octet-stream',
        'x-cr-content-id': data.guid || episodeId,
        'x-cr-video-token': play.token,
      },
    },
    audioType,
    audioLanguage: data.audioLocale,
    subtitles,

    // TODO: Try to revoke using some timeout
    // onDownloadFinished: () => api.revokePlayData(episodeId, data.token),
  };

  return mediaInfo;
};

const getEpisodeIdsBySeries = async (seriesId: string, args: Options) => {
  const response = await fetchSeriesSeasons(seriesId);
  const seasons = response.data;
  if (!seasons?.length) {
    console.error(`No seasons found`);
    return [];
  }

  const episodesQueue = seasons.map((season: any) => {
    const version = filterSeasonVersionsByAudio(season.versions);
    if (!version) return [];
    const overrideSeasonNumber = (episodes: any[]) => {
      return episodes.map((episode: any) => ({
        ...episode,
        season_number: season.season_number,
      }));
    };
    return fetchEpisodes(version.guid)
      .then((data) => overrideSeasonNumber(data.items))
      .catch(() => []);
  });
  const allEpisodes = (await Promise.all(episodesQueue)).flat();
  const eps = common.extendEpisodes(args.episodes || new Map());
  const episodes = eps.items.size
    ? allEpisodes
    : allEpisodes.filter((episode: any) => eps.has(episode.episode_number, episode.season_number));
  if (!episodes?.length) {
    const availableSeasons = seasons
      .map((s: any) => `S${s.season_number.toString().padStart(2, '0')} (${getAudioLocales(s.versions)})`)
      .join(', ');
    console.error(`No suitable episodes found. Available seasons: ${availableSeasons}`);
    return [];
  }
  const episodeIds = episodes.map((episode: any) => episode.id);
  return episodeIds;
};

export default defineExtension({
  name: 'crunchyroll',
  tag: 'CR',
  init,

  fetchContentMetadata: async (url, args) => {
    await updateAuthorizationHeader();
    const episodeId = url.split('watch/')[1]?.split('/')[0];
    const seriesId = url.split('series/')[1]?.split('/')[0];
    const results: ContentMetadata[] = [];
    const langs = structuredClone(args.languages || []);
    if (!langs.length) langs.push('ja-JP');
    for (const lang of langs) {
      args.languages = [lang];
      if (episodeId) {
        const episodeMetadata = await getEpisodeMetadata(episodeId, args);
        results.push(episodeMetadata);
      } else if (seriesId) {
        const episodeIds = await getEpisodeIdsBySeries(seriesId, args);
        for (const episodeId of episodeIds) {
          const episodeMetadata = await getEpisodeMetadata(episodeId, args);
          results.push(episodeMetadata);
        }
      }
    }
    return results;
  },

  fetchContentSource: async (contentId, args) => {
    const episodeSource = await getEpisodeSource(contentId, args);
    return episodeSource;
  },

  fetchContentDrm: async ({ assetId }) => {
    return getDrmConfig(assetId);
  },
});
