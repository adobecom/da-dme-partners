export default {
  FeatureName: 'Smoke Tests',
  features: [
    {
      tcid: '1',
      name: '@lending-page-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
    },

    {
      tcid: '2',
      name: '@home-page-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-latin-na-platinum:',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '3',
      name: '@price-list-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        signInButtonInternationalText: 'Sign In',
        expectedPublicPageURL:
          '/na/channelpartners/home/pricelists/',
      },
    },

    {
      tcid: '4',
      name: '@search-page-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        signInButtonInternationalText: 'Sign In',
        searchText: 'Adobe',
      },
    },

    {
      tcid: '5',
      name: '@user-redirection-apac-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        expectedPublicPageURL:
          '/apac/channelpartners/home/',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '6',
      name: '@user-redirection-emea-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-emea-platinum:',
        expectedPublicPageURL:
          '/emea/channelpartners/home/',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '7',
      name: '@user-redirection-jp-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-japan:',
        expectedPublicPageURL:
          '/jp/channelpartners/home/',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '8',
      name: '@user-redirection-latam-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-latin-america-na-platinum:',
        expectedPublicPageURL:
          '/latam/channelpartners/home/',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '9',
      name: '@announcement-page-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-na-certified:',
        expectedPublicPageURL:
          '/latam/channelpartners/home/',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '10',
      name: '@search-page-query-param-validation-smoke-test',
      path: '/na/channelpartners/home/search/?term=Logo&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-na-certified:',
        signInButtonInternationalText: 'Sign In',
        searchText: 'Logo',
      },
    },

    {
      tcid: '11',
      name: '@retail-program-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
    },

    {
      tcid: '12',
      name: '@apac-specialization-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '13',
      name: '@latam-specialization-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-latin-america-gold:',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '14',
      name: '@emea-specialization-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-spain-platinum:',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '15',
      name: '@korea-specialization-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-kr-gold:',
        signInButtonInternationalText: 'Sign In',
      },
    },

    {
      tcid: '16',
      name: '@uplevel-info-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-de-gold:',
        signInButtonInternationalText: 'Sign In',
        expectedResellerProgramURL:
          '/Reseller_Program_Guide_EMEA.pdf',
        expectedRetailProgramURL:
          '/EMEA_Retail_Program_Guide.pdf',
      },
    },

    {
      tcid: '17',
      name: '@cal-links-apac-validation-smoke-test',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        signInButtonInternationalText: 'Sign In',
        expectedApacEmail:
          'apacpm@adobe.com',
      },
    },

    {
      tcid: '18',
      name: '@join-now-button-validation-smoke-test',
      path: '/channelpartners/#?martech=off',
      tags: '@dme-smoke-test',
      data: {
        joinNowButtonText: 'Join Now',
        joinNowButtonFrenchText: 'Adhérer',
        joinNowButtonGermanText: 'Mitglied werden',
        joinNowButtonItalianText: 'Iscriviti',
        joinNowButtonSpanishText: 'Unirse ahora',
        joinNowButtonKorianText: '가입하기',
        joinNowButtonChinaText: '立即加入',
        joinNowButtonJapanText: '参加する',
        naLocaleSwitchUrl: '/na/channelpartners/#?martech=off',
        latamLocaleSwitchUrl: '/latam/channelpartners/#?martech=off',
        emeaLocaleSwitchUrl: '/emea/channelpartners/#?martech=off',
        frLocaleSwitchUrl: '/fr/channelpartners/#?martech=off',
        deLocaleSwitchUrl: '/de/channelpartners/#?martech=off',
        itLocaleSwitchUrl: '/it/channelpartners/#?martech=off',
        esLocaleSwitchUrl: '/es/channelpartners/#?martech=off',
        apacLocaleSwitchUrl: '/apac/channelpartners/#?martech=off',
        krLocaleSwitchUrl: '/kr/channelpartners/#?martech=off',
        cnLocaleSwitchUrl: '/cn/channelpartners/#?martech=off',
        jpLocaleSwitchUrl: '/jp/channelpartners/#?martech=off',
      },
    },

    {
      tcid: '19',
      name: '@find-partner-validation-smoke-test',
      path: '/na/channelpartners/?akamaiLocale=es&georouting=on&martech=off',
      tags: '@dme-smoke-test',
      data: {
        findPartnerLinkText: 'Find a Partner',
        findPartnerGermanLinkText: 'Adobe-Partner suchen',
        findPartnerJapanLinkText: 'パートナーを見つける',
        deLocalePartnerUrl: '/de/channelpartners/?akamaiLocale=es&georouting=on&martech=off',
        jpLocalePartnerUrl: '/jp/channelpartners/?akamaiLocale=es&georouting=on&martech=off',
        geoModalLinkNA: 'North America',
        geoModalLinkGerman: 'Deutschland',
        geoModalLinkJapan: '日本',

      },
    },

    {
      tcid: '20',
      name: '@sso-integration-between-apc-and-cbc',
      path: '/na/channelpartners/home/#?georouting=on&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        cbcConnectionDomain: 'cbconnection',
        expectedURL: '/bin/fusion/modalImsLogin?resource=%2Fen%2Fnews%2Fenablement-news-partner-lock',
      },
    },

    {
      tcid: '21',
      name: '@sso-integration-between-apc-and-finder',
      path: '/na/channelpartners/home/#?georouting=on&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        expectedSalesForceURL: '/s/directory/channel?lang=en&view=distributor',
        expectedFindURL: '/s/directory/channel?lang=en&view=distributor',
      },
    },
    {
      tcid: '22',
      name: '@na-footer-and-gnav-validation',
      path: '/channelpartners/#?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        defaultURL: '/na/channelpartners/',
        programURL: '/na/channelpartners/program/',
        supportURL: '/na/channelpartners/support/',
      },
    },
    {
      tcid: '23',
      name: '@kr-footer-and-gnav-validation',
      path: '/channelpartners/#?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        defaultURL: '/kr/channelpartners/',
        programURL: '/kr/channelpartners/program/',
        supportURL: '/kr/channelpartners/support/',
      },
    },
    {
      tcid: '24',
      name: '@logo-redirection-validation-smoke-test',
      path: '/na/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        signInButtonInternationalText: 'Sign In',
        logoRedirectionURLProtected: '/na/channelpartners/home/',
        logoRedirectionURLPublic: '/na/channelpartners/',
      },
    },
    {
      tcid: '25',
      name: '@prp-collection-smoke-test',
      path: '/na/channelpartners/home/marketing/resources/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-emea-platinum:',
        signInButtonInternationalText: 'Sign In',
        sortOldest: 'oldest',
        firstFilterSection: 'Product',
        secondFilterSection: 'Topic',
      },
    },
    {
      tcid: '26',
      name: '@smoke-test-feedback-mechanism-restricted-page-validation',
      path: '/channelpartners/?georouting=off&martech=off',
      tags: '@dme-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        feedbackTitle: 'Rate this page',
        feedbackTextArea: 'Automation Test Keywords',
      },
    },
  ],
};
