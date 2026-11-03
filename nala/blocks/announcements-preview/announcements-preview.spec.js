export default {
  FeatureName: 'DME Announcements Preview',
  features: [
    {
      tcid: '1',
      name: '@desc-regression-announcements-preview-platinum-user',
      path: '/channelpartners/drafts/automation/regression/announcement-preview?georouting=off&martech=off',
      // tags: '@dme-announcements-preview @regression @anonymous',
      data: {
        partnerData: {
          partnerPortal: 'CPP',
          partnerLevel: 'Platinum',
          permissionRegion: 'Europe West',
        },
        signInButton: 'Sign In',
        selectedSortNewest: 'Date: newest',
        rootPath: '/channelpartners/',
      },
    },
    {
      tcid: '2',
      name: '@desc-regression-announcements-preview-registered-user',
      path: '/channelpartners/drafts/automation/regression/announcement-preview?georouting=off&martech=off',
      // tags: '@dme-announcements-preview @regression @anonymous',
      data: {
        partnerData: {
          partnerPortal: 'CPP',
          partnerLevel: 'Registered',
          permissionRegion: 'China',
        },
        signInButton: 'Sign In',
        selectedSortNewest: 'Date: newest',
        rootPath: '/channelpartners/',
      },
    },
    {
      tcid: '3',
      name: '@desc-regression-announcements-preview-gold-user',
      path: '/channelpartners/drafts/automation/regression/announcement-preview?georouting=off&martech=off',
      // tags: '@dme-announcements-preview @regression @anonymous',
      data: {
        partnerData: {
          partnerPortal: 'CPP',
          partnerLevel: 'Gold',
          permissionRegion: 'Latin America',
        },
        signInButton: 'Sign In',
        selectedSortNewest: 'Date: newest',
        rootPath: '/channelpartners/',
      },
    },
    {
      tcid: '4',
      name: '@desc-regression-announcements-preview-certified-user',
      path: '/channelpartners/drafts/automation/regression/announcement-preview?georouting=off&martech=off',
      tags: '@dme-announcements-preview @regression @anonymous',
      data: {
        partnerData: {
          partnerPortal: 'CPP',
          partnerLevel: 'Certified',
          permissionRegion: 'Europe East',
        },
        signInButton: 'Sign In',
        selectedSortNewest: 'Date: newest',
        rootPath: '/channelpartners/',
      },
    },
    {
      tcid: '5',
      name: '@desc-regression-announcements-preview-distributor-user',
      path: '/channelpartners/drafts/automation/regression/announcement-preview?georouting=off&martech=off',
      tags: '@dme-announcements-preview @regression @anonymous',
      data: {
        partnerData: {
          partnerPortal: 'CPP',
          partnerLevel: 'Distributor',
          permissionRegion: 'North America',
        },
        signInButton: 'Sign In',
        selectedSortNewest: 'Date: newest',
        rootPath: '/channelpartners/',
      },
    },
  ],
};
