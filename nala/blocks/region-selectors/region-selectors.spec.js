export default {
  FeatureName: 'DME Region Selectors',
  features: [
    {
      tcid: '1',
      name: '@desc-regression-region-selectors-north-america',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/na/channelpartners/',
        linkText: 'North America',
      },
    },
    {
      tcid: '2',
      name: '@desc-regression-region-selectors-latin-america',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/latam/channelpartners/',

        linkText: 'Latin America',
      },
    },
    {
      tcid: '3',
      name: '@desc-regression-region-selectors-europe-middle-east-africa',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/emea/channelpartners/',
        linkText: 'Europe, Middle East, and Africa (English)',
      },
    },
    {
      tcid: '4',
      name: '@desc-regression-region-selectors-france',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/fr/channelpartners/',
        linkText: 'France',
      },
    },
    {
      tcid: '5',
      name: '@desc-regression-region-selectors-germany',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/de/channelpartners/',
        linkText: 'Deutschland',
      },
    },
    {
      tcid: '6',
      name: '@desc-regression-region-selectors-italy',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/it/channelpartners/',
        linkText: 'Italia',
      },
    },
    {
      tcid: '7',
      name: '@desc-regression-region-selectors-asia-pacific',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/apac/channelpartners/',
        linkText: 'Asia Pacific (English)',
      },
    },
    {
      tcid: '8',
      name: '@desc-regression-region-selectors-korea',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/kr/channelpartners/',
        linkText: '한국',
      },
    },
    {
      tcid: '9',
      name: '@desc-regression-region-selectors-china',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/cn/channelpartners/',
        linkText: '中国',
      },
    },
    {
      tcid: '10',
      name: '@desc-regression-region-selectors-japan',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/jp/channelpartners/',
        linkText: 'Japan',
      },
    },
    {
      tcid: '11',
      name: '@desc-regression-region-selectors-japan-second-link',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @anonymous @dme-main',
      data: {
        changeRegionEng: 'Change region',
        localeSwitchUrl: '/jp/channelpartners/',
        linkText: '日本',
      },
    },
    {
      tcid: '12',
      name: '@login-regression-region-selectors-spain',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-region-selector @regression @circleCi',
      data: {
        partnerLevel: 'cpp-spain-platinum:',
        localeSwitchUrl: '/es/channelpartners/',
        changeRegionEng: 'Change region',
        changeRegionEsp: 'Cambiar región',
        closePopUpButton: 'Close',
        signInButton: 'Iniciar sesión',
        linkText: 'España',
        titleText: 'Elige tu región',
        titleDesc: 'Al seleccionar una región, se cambia el idioma o el contenido del sitio para partners de canal de Adobe.',

      },
    },
  ],
};
