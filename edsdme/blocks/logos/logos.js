import { getLibs } from '../../scripts/utils.js';
import { getConfig, populateLocalizedTextFromListItems, localizationPromises } from '../utils/utils.js';
import Logos from './LogosCards.js';

function declareLogos() {
  if (customElements.get('logos-cards')) return;
  customElements.define('logos-cards', Logos);
}

export default async function init(el) {
  const miloLibs = getLibs();
  const config = getConfig();

  const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
  loadStyle('/edsdme/components/PartnerCards.css');
  loadStyle('/edsdme/components/SearchCard.css');
  loadStyle('/edsdme/blocks/search-full/search-full.css');

  const sectionIndex = el.parentNode.getAttribute('data-idx');
  const isMain = el.classList.contains('main');

  const localizedText = {
    '{{no-results-title}}': 'No Results Found',
    '{{size}}': 'Size',
    '{{last-modified}}': 'Last modified',
  };

  populateLocalizedTextFromListItems(el, localizedText);

  const deps = await Promise.all([
    localizationPromises(localizedText, config),
    import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/button.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/progress-circle.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/action-button.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/icons-workflow.js`),
  ]);

  declareLogos();

  const blockData = {
    localizedText,
    tableData: el.children,
    ietf: config.locale.ietf,
    isMain,
  };

  const app = document.createElement('logos-cards');
  app.className = `logos-cards-wrapper${blockData.isMain ? ' main' : ''}`;
  app.blockData = blockData;
  app.setAttribute('daa-lh', 'Logos Block');
  app.setAttribute('data-idx', sectionIndex);
  el.replaceWith(app);

  await deps;
  return app;
}
