export const DOMAINS = {
  default: 'https://www.crunchyroll.com',
  defaultApi: 'https://api.crunchyroll.com',
  beta: 'https://beta.crunchyroll.com',
  betaApi: 'https://beta-api.crunchyroll.com',
  proto: 'https://beta-api.etp-proto0.com',
  staging: 'https://beta-stage-api.crunchyroll.com',
  play: 'https://cr-play-service.prd.crunchyrollsvc.com',
};

export const ROUTES = {
  rss: `${DOMAINS.default}/rss/anime`,
  token: `${DOMAINS.betaApi}/auth/v1/token`,
  cms: `${DOMAINS.betaApi}/cms/v2`,
  index: `${DOMAINS.betaApi}/index/v2`,
  contentCms: `${DOMAINS.betaApi}/content/v2/cms`,
  profile: `${DOMAINS.betaApi}/accounts/v1/me/profile`,
  drm: `${DOMAINS.betaApi}/drm/v1/auth`,
  play: `${DOMAINS.play}/v1`,
};

export const CLIENTS = {
  mobile: { id: 'punh4hkqqc901uyiijz7', secret: 'lN80LwOzs6LQp7uG3DRcSiQTGdTSwGo4' }, // ConfigurationImpl.kt
  switch: { id: 't-kdgp2h8c3jub8fn0fq', secret: 'yfLDfMfrYvKXh4JXS1LEI2cCqu1v5Wan' },
  tv: { id: 'ju8lksokvlqmg1_fjmnv', secret: 'AMZSQvd9Dg-kI4Qc7NPqiU5O6aKoZIkh' },
  tvProto: { id: 'haz2ernyiind8rkvoeg-', secret: 'kce7P5Af9-OMoNnXcVwqZCpg1vFeaR0p' },
  tvStaging: { id: 'tomiq98p-npokj4zqw94', secret: 'Ks9ZAi2EDToP2ob6xr5bkCh5LDZIaaMS' },
  firetv: { id: 'nmvjshfknymxxkg7fbh9', secret: 'ZYIVrBWUPbcXDtbD22VSLa6b4WQos3zX' },
  firetvProto: { id: 'ys_wlhqy6xszxrzq_xz1', secret: 'eHDBEATsYsikC5TaukArgpmfxKY7nCH9' },
  firetvStaging: { id: 'buieosfrytrycw9gco7b', secret: 'GAJSFWaWopNDZetpHJsS2qEd4CdlJG96\n' },
};

const createBasicToken = (clientId: string, clientSecret: string) =>
  Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

const createDevice = <T = Record<string, string>>(
  options: T & { clientId: string; clientSecret: string }
): T & { basicToken: string; authorization: string } => {
  const basicToken = createBasicToken(options.clientId, options.clientSecret);
  return { ...options, basicToken, authorization: `Basic ${basicToken}` };
};

export const DEVICES = {
  nintendoSwitch: createDevice({
    id: crypto.randomUUID(),
    platform: 'console',
    name: 'switch',
    type: 'Nintendo Switch',
    userAgent: 'Crunchyroll/1.8.0 Nintendo Switch/12.3.12.0 UE4/4.27',
    clientId: CLIENTS.switch.id,
    clientSecret: CLIENTS.switch.secret,
  }),
  androidPhone: createDevice({
    id: crypto.randomUUID(),
    platform: 'android',
    name: 'phone',
    type: 'Samsung SM-S900C',
    userAgent: 'Crunchyroll/3.60.0 Android/9 okhttp/4.12.0',
    clientId: CLIENTS.mobile.id,
    clientSecret: CLIENTS.mobile.secret,
  }),
};

export const DEVICE = DEVICES.androidPhone;
