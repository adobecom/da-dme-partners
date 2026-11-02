import { PROGRAM } from '../blocks/utils/dmeConstants.js';

import { getPartnerCookieObject, hasSalesCenterAccess } from './utils.js';

export const PERSONALIZATION_HIDE = 'personalization-hide';

// Evaluated at import time, so a malformed cookie must not break every module that imports this.
function getSafePartnerCookieObject() {
  try {
    return getPartnerCookieObject(PROGRAM);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing partner cookie object:', error);
    return {};
  }
}

export const COOKIE_OBJECT = getSafePartnerCookieObject();

export function processPrimaryContact(el) {
  const isPrimary = COOKIE_OBJECT.primaryContact;
  el.classList.add(PERSONALIZATION_HIDE);
  if (!isPrimary) return;
  const primaryContactWrapper = document.createElement('div');
  const primaryContact = document.createElement('p');
  primaryContact.textContent = el.textContent;
  primaryContactWrapper.classList.add('primary-contact-wrapper');
  primaryContactWrapper.appendChild(primaryContact);
  el.replaceWith(primaryContactWrapper);
}

export function processSalesAccess(el) {
  const salesAccess = hasSalesCenterAccess();
  const element = el.parentElement;
  if (!salesAccess) {
    element.classList.add(PERSONALIZATION_HIDE);
    return;
  }
  const divider = document.createElement('hr');
  element.insertBefore(divider, el);
}
