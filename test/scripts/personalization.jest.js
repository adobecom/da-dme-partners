/**
 * @jest-environment jsdom
 */
import path from 'path';
import fs from 'fs';

const PERSONALIZATION_HIDE_CLASS = 'personalization-hide';
jest.mock('./../../edsdme/libs/deps/purify-wrapper.js', () => ({
  __esModule: true,
  default: { sanitize: jest.fn((v) => v) },
}));
function importModules() {
  // eslint-disable-next-line global-require
  const { applyPagePersonalization, applyGnavPersonalization } = require('../../edsdme/scripts/personalization.js');
  jest.mock('../../edsdme/blocks/utils/utils.js', () => ({ getConfig: jest.fn(() => ({ env: { name: 'stage' } })) }));

  return { applyPagePersonalization, applyGnavPersonalization };
}

describe('Test personalization.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window = Object.create(window);
    window.history.pushState({}, '', '/channelpartners/');
    document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, './mocks/personalization.html'),
      'utf8',
    );
    document.cookie = 'partner_data=';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });
  it('Populate placeholder if user is a member', () => {
    jest.isolateModules(() => {
      const cookieObject = { CPP: { status: 'MEMBER' } };
      const partnerInfo = { firstName: 'Test user' };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const placeholderElementAfter = document.querySelector('#welcome-firstname');
      expect(placeholderElementAfter.textContent.includes(partnerInfo.firstName)).toBe(true);
      expect(placeholderElementAfter.querySelector('a')).toBeTruthy();
      expect(placeholderElementAfter.textContent.includes(partnerInfo.firstName)).toBe(true);
      expect(placeholderElementAfter.classList.contains('firstname-placeholder')).toBe(false);
    });
  });
  it('Remove placeholder if user is not a member', () => {
    jest.isolateModules(() => {
      const cookieObject = { SPP: { status: 'MEMBER' } };
      document.cookie = 'partner_info=; Max-Age=0;';
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const placeholderElementAfter = document.querySelector('#welcome-firstname');
      expect(placeholderElementAfter).toBe(null);
    });
  });
  it('Show partner-not-signed-in block', () => {
    jest.isolateModules(() => {
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const notSignedInBlock = document.querySelector('.partner-not-signed-in');
      expect(notSignedInBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });

  it('Show partner-not-member block', () => {
    jest.isolateModules(() => {
      const cookieObject = { SPP: { status: 'MEMBER' } };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const notMemberBlock = document.querySelector('.partner-not-member');
      expect(notMemberBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show partner-all-levels block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        CPP: {
          status: 'MEMBER',
          level: 'Gold',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const allLevelsBlock = document.querySelector('.partner-all-levels');
      expect(allLevelsBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show partner-level-gold block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        CPP: {
          status: 'MEMBER',
          level: 'Gold',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const goldBlock = document.querySelector('.partner-level-gold');
      expect(goldBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show partner-level-platinum but don\'t show partner-level-gold block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        CPP: {
          status: 'MEMBER',
          level: 'Platinum',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const goldBlock = document.querySelector('.partner-level-gold');
      const platinumBlock = document.querySelector('.partner-level-platinum');
      expect(platinumBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
      expect(goldBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(true);
    });
  });
  it('Show partner-level-platinum section', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        CPP: {
          status: 'MEMBER',
          level: 'Platinum',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const platinumBlock = document.querySelector('#platinum-section');
      expect(platinumBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  describe('Gnav personalization', () => {
    const parser = new DOMParser();
    let gnav;
    beforeEach(() => {
      const gnavString = fs.readFileSync(
        path.resolve(__dirname, './mocks/gnav-personalization.html'),
        'utf8',
      );
      gnav = parser.parseFromString(gnavString, 'text/html');
      document.importNode = (node) => node;
    });
    afterEach(() => {
      gnav = null;
    });
    it('Replaces profile dropdown placeholders', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          CPP: {
            status: 'MEMBER',
            level: 'Platinum',
          },
        };
        const partnerInfo = {
          firstName: 'Test Name',
          company: 'Test Company',
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;
        const companyPlaceholder = gnav.querySelector('#test-company-placeholder');
        const levelPlaceholder = gnav.querySelector('#test-level-placeholder');
        expect(companyPlaceholder.textContent).toEqual('$company');
        expect(levelPlaceholder.textContent).toEqual('$level');
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const companyPlaceholderUpdated = personalizedGnav.querySelector('#test-company-placeholder');
        const levelPlaceholderUpdated = personalizedGnav.querySelector('#test-level-placeholder');
        expect(companyPlaceholderUpdated.textContent).toEqual('Test Company');
        expect(levelPlaceholderUpdated.textContent).toEqual('Platinum');
        expect(levelPlaceholder.classList.contains('level-placeholder')).toBe(true);
      });
    });
    it('Show primary contact', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          CPP: {
            status: 'MEMBER',
            level: 'Platinum',
            primaryContact: true,
          },
        };
        const partnerInfo = {
          firstName: 'Test Name',
          company: 'Test Company',
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const primaryContact = personalizedGnav.querySelector('.primary-contact-wrapper');
        expect(primaryContact).toBeTruthy();
      });
    });
    it('Show renew expired', () => {
      jest.isolateModules(() => {
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() + 30);
        const cookieObject = {
          CPP: {
            status: 'MEMBER',
            level: 'Gold',
            primaryContact: true,
            accountAnniversary: expiredDate,
          },
        };
        const partnerInfo = {
          firstName: 'Test Name',
          company: 'Test Company',
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const renewExpired = personalizedGnav.querySelector('.partner-expired');
        expect(renewExpired.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBeFalsy();
      });
    });
    it('Show renew suspended', () => {
      jest.isolateModules(() => {
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() - 30);
        const cookieObject = {
          CPP: {
            status: 'MEMBER',
            level: 'Gold',
            primaryContact: true,
            accountAnniversary: expiredDate,
          },
        };
        const partnerInfo = {
          firstName: 'Test Name',
          company: 'Test Company',
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const renewExpired = personalizedGnav.querySelector('.partner-suspended');
        expect(renewExpired.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBeFalsy();
      });
    });
    it('Show sales center link', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          CPP: {
            status: 'MEMBER',
            level: 'Gold',
            primaryContact: true,
            salesCenterAccess: true,
          },
        };
        const partnerInfo = {
          firstName: 'Test Name',
          company: 'Test Company',
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;
        const salesCenterLink = gnav.querySelector('#sales-link');
        const { applyGnavPersonalization } = importModules();
        applyGnavPersonalization(gnav);
        expect(salesCenterLink.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBeFalsy();
      });
    });
    it('Should hide partner-level-platinum gnav items for non-platinum user', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          CPP: {
            status: 'MEMBER',
            level: 'Silver',
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test user' })}`;
        const { applyGnavPersonalization } = importModules();

        let platinumText = gnav.querySelector('#text-platinum');
        const anchorsFilterPredicate = (el) => el.textContent.includes('cta primary platinum') || el.textContent.includes('cta secondary platinum') || el.textContent.includes('link platinum');
        let anchorsArray = Array.from(gnav.querySelectorAll('a')).filter(anchorsFilterPredicate);

        expect(platinumText).not.toBeNull();
        expect(anchorsArray.length).toBe(3);

        const result = applyGnavPersonalization(gnav);

        platinumText = result.querySelector('#text-platinum');
        anchorsArray = Array.from(gnav.querySelectorAll('a')).filter(anchorsFilterPredicate);

        expect(platinumText).toBeNull();
        expect(anchorsArray.length).toBe(0);
      });
    });

    it('Should hide partner-sales-access gnav items for users without sales center access', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          CPP: {
            status: 'MEMBER',
            firstName: 'Test user',
            level: 'Silver',
            salesCenterAccess: false,
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const { applyGnavPersonalization } = importModules();

        let heading = gnav.querySelector('#sales-center');
        let list = gnav.querySelector('#sales-center + ul');

        expect(heading).not.toBeNull();
        expect(list).not.toBeNull();

        const result = applyGnavPersonalization(gnav);

        heading = result.querySelector('#sales-center');
        list = result.querySelector('#sales-center + ul');

        expect(heading).toBeNull();
        expect(list).toBeNull();
      });
    });
  });
});
