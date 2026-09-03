export default {
  FeatureName: 'Analytics Attributes',
  features: [
    {
      tcid: '1',
      name: '@analytics-attributes-announcement-preview-page',
      path: '/channelpartners/home/announcements/',
      tags: '@analytics-attributes @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        daaLh: 'Card Collection | Filters: No Filters | Search Query: None',
        daaLhAfterSearch: 'Card Collection | Filters: No Filters | Search Query: Adobe',
        searchKeyWord: 'Adobe',
      },
    },
    {
      tcid: '2',
      name: '@analytics-attributes-search-page',
      path: '/channelpartners/home/search/',
      tags: '@analytics-attributes @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        searchKeyWord: 'Adobe',
        filter: 'Topic',
        checkBoxName: 'Channel Authorization Letter',
        daaLh: 'Search Cards Content | Filters: No Filters | Search Query: None',
        daaLhAfterSearch: 'Search Cards Content | Filters: Channel Authorization Letter | Search Query: Adobe',
      },
    },
    {
      tcid: '3',
      name: '@analytics-attributes-pricelists-page',
      path: '/channelpartners/home/pricelists/',
      tags: '@analytics-attributes @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        searchKeyWord: 'North America',
        filter: 'Currency',
        checkBoxName: 'USD',
        daaLh: 'Card Collection | Filters: No Filters | Search Query: None',
        daaLhAfterSearch: 'Card Collection | Filters: USD | Search Query: North America',
      },
    },
    {
      tcid: '4',
      name: '@analytics-attributes-prp-collection-page',
      path: '/channelpartners/home/marketing/resources/',
      tags: '@analytics-attributes @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        searchKeyWord: 'adobe',
        filter: 'Product',
        checkBoxName: 'Adobe Sign',
        daaLh: 'Card Collection | Filters: No Filters | Search Query: None',
        daaLhAfterSearch: 'Card Collection | Filters: Adobe Sign | Search Query: adobe',
      },
    },
    {
      tcid: '5',
      name: '@analytics-attributes-feedback-mechanism-page',
      path: '/channelpartners/home/',
      tags: '@analytics-attributes @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        daaLh: 'Feedback',
      },
    },
    {
      tcid: '6',
      name: '@analytics-attributes-yukon-chat',
      path: '/channelpartners/home/',
      tags: '@analytics-attributes @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-us:',
        daaLh: 'Yukon Chat Block',
      },
    },
  ],
};
