export default {
  FeatureName: 'DME Form page',
  features: [
    {
      tcid: '1',
      name: '@desc-dme-form-distributor-user',
      path: '/na/channelpartners/drafts/automation/regression/dme-form/promo-pricing-rebate-request-form?georouting=off&martech=off',
      publicPath: '/na/channelpartners/drafts/automation/regression/dme-form/promo-pricing-rebate-request-form-public?georouting=off&martech=off,',
      tags: '@dme-form @regression @anonymous @circleCi @dme-main',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        signInButton: 'Sign In',
        partnerData: {
          partnerPortal: 'CPP',
          partnerLevel: 'Distributor',
          permissionRegion: 'North America',
          firstName: 'Yugo Stage',
          lastName: 'Distributor US',
          email: 'yugo-stage-cpp-distributor-us@yopmail.com',
        },
        thankYouPageURL: '/na/channelpartners/drafts/automation/regression/dme-form/thank-you-promo-form',
      },
    },
    {
      tcid: '2',
      name: '@desc-dme-form-gold-user',
      path: '/na/channelpartners/drafts/automation/regression/dme-form/promo-pricing-rebate-request-form?georouting=off&martech=off',
      tags: '@dme-form @circleCi',
      data: {
        partnerLevel: 'cpp-gold-all:',
        signInButton: 'Sign In',
      },
    },
  ],
};
