import { getCaasUrl } from '../../scripts/utils.js';
import { getConfig, localizationPromises } from '../utils/utils.js';
import AnnouncementsPreview from './AnnouncementsPreviewCards.js';

function declareAnnouncementsPreview() {
  if (customElements.get('announcements-preview-cards')) return;
  customElements.define('announcements-preview-cards', AnnouncementsPreview);
}

export default async function init(el) {
  const config = getConfig();
  const newestCards = [];

  const block = {
    el,
    collectionTag: '"caas:adobe-partners/collections/announcements"',
    ietf: config.locale.ietf,
  };

  const localizedText = { '{{no-partner-announcement}}': 'Currently, there are no partner announcements' };

  const deps = await Promise.all([
    localizationPromises(localizedText, config),
  ]);

  declareAnnouncementsPreview();

  const blockData = {
    caasUrl: getCaasUrl(block),
    ietf: config.locale.ietf,
    tableData: el.children,
    title: '',
    buttonText: '',
    link: '',
    localizedText,
    newestCards,
    heading: 'heading-l',
    buttonSize: 'm-button',
  };

  const app = document.createElement('div');
  app.className = 'announcements-preview';
  app.setAttribute('daa-lh', 'Announcements Preview Cards');
  app.classList.add('con-block');
  el.classList.forEach((elem) => {
    if (elem.includes('button')) {
      blockData.buttonSize = elem;
    }
    if (!elem.includes('heading')) {
      app.classList.add(elem);
    }
  });
  Array.from(el.children).forEach((row) => {
    const cols = Array.from(row.children);
    const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');

    if (rowTitle && rowTitle === 'title') {
      blockData.title = cols[1].innerText;
    }
    if (rowTitle && rowTitle === 'page-url') {
      blockData.link = cols[1].querySelector('a')?.href;
    }
    if (rowTitle && rowTitle === 'button-text') {
      blockData.buttonText = cols[1].innerText;
    }
  });

  if (blockData.title) {
    el.classList.forEach((elem) => {
      if (elem.includes('heading')) {
        blockData.heading = 'heading-'.concat(elem.split('-')[0]);
      }
    });
  }

  const previewCards = document.createElement('announcements-preview-cards');
  previewCards.blockData = blockData;
  app.appendChild(previewCards);

  await deps;
  el.replaceWith(app);
}
