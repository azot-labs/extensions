import type { Cms } from './types';
import { DEVICE, ROUTES } from './constants';

const request = async (url: string, method: string = 'GET') => {
  logger.debug(`Getting data from ${url}...`);
  const response = await http.fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${storage.accessToken}`,
      'User-Agent': DEVICE.userAgent,
    },
  });
  const data = (await response.text()) || '';
  response.status === 401 && logger.error(`Unauthorized: ${url}`);
  response.status === 400 && logger.error(`Bad Request: ${url}`);
  const isSuccess = response.status === 200;
  if (!isSuccess) logger.debug(`Request failed. Route: ${url}. ${data}`);
  try {
    return data ? JSON.parse(data) : data;
  } catch (e) {
    logger.debug(data);
    logger.debug(e as any);
    logger.error(`Parsing JSON response failed. Route: ${url}`);
    process.exit(1);
  }
};

const getCms = () => (storage.cmsAuth?.cms || {}) as Cms;

const getSign = (cms = getCms()) => ({
  Policy: cms.policy,
  Signature: cms.signature,
  'Key-Pair-Id': cms.key_pair_id,
});

const sign = (params: Record<string, string> = {}) => new URLSearchParams({ ...params, ...getSign() }).toString();

const DEFAULT_DUB = 'ja-JP';
const preferDub = (language: string = DEFAULT_DUB) => ({ preferred_audio_language: language });

export const fetchProfile = async () => {
  return request(ROUTES.profile);
};

export const fetchPlayData = async (
  id: string | number,
  devicePlatform = DEVICE.platform,
  deviceName = DEVICE.name
) => {
  return request(`${ROUTES.play}/${id}/${devicePlatform}/${deviceName}/play`);
};

export const revokePlayData = async (id: string | number, token: string) => {
  return request(`${ROUTES.play}/token/${id}/${token}`, 'DELETE');
};

export const fetchObject = async (objectId: string | number) => {
  return request(`${ROUTES.cms}${getCms().bucket}/objects/${objectId}?${sign()}`);
};

export const fetchStreams = async (videoId: string) => {
  return request(`${ROUTES.cms}${getCms().bucket}/videos/${videoId}/streams?${sign()}`);
};

export const fetchSeries = async (seriesId: string, dub?: string) => {
  return request(`${ROUTES.contentCms}/series/${seriesId}?${sign(preferDub(dub))}`);
};

export const fetchSeriesSeasons = async (seriesId: string, dub?: string) => {
  return request(`${ROUTES.contentCms}/series/${seriesId}/seasons?${sign(preferDub(dub))}`);
};

export const fetchSeason = async (seasonId: string, dub?: string) => {
  return request(`${ROUTES.contentCms}/seasons/${seasonId}?${sign(preferDub(dub))}`);
};

export const fetchEpisodes = async (seasonId: string) => {
  return request(`${ROUTES.cms}${getCms().bucket}/episodes?${sign({ season_id: seasonId })}`);
};
