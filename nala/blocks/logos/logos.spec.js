export default {
  FeatureName: 'DME Logos',
  features: [
    {
      tcid: '1',
      name: '@desc-validate-logos-details',
      path: '/na/channelpartners/home/marketing/logos/?georouting=off&martech=off',
      tags: '@dme-logos @regression @circleCi',
      data: {
        partnerLevel: 'cpp-na-certified:',
        downloadButtonLink: '/channelpartnerassets/apc-assets/restricted/apc-1/cars_4.pdf',
      },
    },
  ],
};
