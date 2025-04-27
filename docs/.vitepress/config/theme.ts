import type { DefaultTheme, HeadConfig, LocaleConfig } from 'vitepress';
import { createTranslate } from '../i18n/utils';

export function getLocaleConfig(lang: string) {
  const t = createTranslate(lang);

  const urlPrefix = lang && lang !== 'en' ? (`/${lang}` as const) : '';
  const title = t('Streamyx API');
  const description = t('Start building your perfect extensions with the Streamyx API');
  const titleTemplate = `:title | ${description}`;

  const docsLink = `https://developers.streamyx.ru/`;
  const ogImage = `https://streamyx.ru/favicon.ico`;

  const head: HeadConfig[] = [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: 'https://streamyx.ru/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#ff7e17' }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: docsLink }],
    ['meta', { property: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { property: 'twitter:image', content: ogImage }],
  ];

  const nav: DefaultTheme.NavItem[] = [{ text: t('Home'), link: `${urlPrefix}/` }];

  const sidebar: DefaultTheme.SidebarItem[] = [
    {
      base: `${urlPrefix}`,
      items: [
        {
          items: [{ text: t('Introduction'), link: '/index.md' }],
        },
        {
          text: t('Basics'),
          items: [{ text: t('Getting Started'), link: '/getting-started.md' }],
        },
      ],
    },
  ];

  const themeConfig: DefaultTheme.Config = {
    logo: { src: 'https://streamyx.ru/favicon.ico', width: 24, height: 24 },
    nav,
    sidebar,
    outline: 'deep',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vitalygashkov/streamyx-extensions' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@streamyx/api' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present Vitaly Gashkov & Contributors',
    },
  };

  if (lang === 'ru-RU') {
    Object.assign(themeConfig, {
      outline: {
        label: 'На этой странице',
        level: 'deep',
      },
      lastUpdatedText: 'Последнее обновление',
      darkModeSwitchLabel: 'Тема',
      sidebarMenuLabel: 'Меню',
      returnToTopLabel: 'Наверх',
      langMenuLabel: 'Выбор языка',
      docFooter: {
        prev: 'Предыдущая',
        next: 'Следующая',
      },
    } satisfies DefaultTheme.Config);
  }

  const localeConfig: LocaleConfig<DefaultTheme.Config>[string] = {
    label: t('English'),
    lang: t('en'),
    title,
    titleTemplate,
    description,
    head,
    themeConfig,
  };

  return localeConfig;
}
