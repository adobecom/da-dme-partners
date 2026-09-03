import { formatDate, getLibs } from '../scripts/utils.js';
import { getConfig, replaceText } from '../blocks/utils/utils.js';

const miloLibs = getLibs();
const config = getConfig();
const { html, repeat, LitElement, until, nothing } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

class SearchCard extends LitElement {
  createRenderRoot() { return this; }

  static properties = {
    data: { type: Object },
    localizedText: { type: Object },
    ietf: { type: String },
  };

  get cardTags() {
    const tags = this.data.arbitrary;
    if (!tags.length) return;
    const filteredTags = tags.filter((tag) => !Object.keys(tag).includes('partnerlevel')
      && !Object.values(tag).includes('cpp')
      && !Object.values(tag).includes('collections'));
    if (!filteredTags.length) return;
    // eslint-disable-next-line consistent-return
    return html`${repeat(
      filteredTags,
      (tag) => tag.key,
      (tag) => {
        const key = Object.values(tag)[0];
        const wrappedKey = `{{${key}}}`;
        return html`${until(
          // eslint-disable-next-line no-confusing-arrow
          replaceText(wrappedKey, config).then((res) => res ? html`<span class="card-tag">${res}</span>` : html``),
          html``,
        )}`;
      },
    )}`;
  }

  // eslint-disable-next-line class-methods-use-this
  toggleCard(searchCard) {
    searchCard.classList.toggle('expanded');
  }

  // eslint-disable-next-line class-methods-use-this
  isDownloadDisabled(fileType) {
    const disabledTypes = ['html', 'announcement'];
    return disabledTypes.includes(fileType);
  }

  // eslint-disable-next-line class-methods-use-this
  isPreviewEnabled(fileType) {
    const enabledTypes = ['pdf', 'html', 'announcement'];
    return enabledTypes.includes(fileType);
  }

  // eslint-disable-next-line class-methods-use-this
  getFileType(type) {
    const supportedFileTypes = ['excel', 'pdf', 'powerpoint', 'video', 'word', 'zip', 'html', 'announcement'];
    return supportedFileTypes.includes(type) ? type : 'default';
  }

  /* eslint-disable indent */
  render() {
    const title = this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : '';
    const trackingTitle = processTrackingLabels(title, getConfig(), 30);
    const isDlDisabled = this.isDownloadDisabled(this.data.contentArea?.type);

    return html`
      <div class="search-card" @click=${(e) => this.toggleCard(e.currentTarget)}>
        <div class="card-header">
          <div class="card-title-wrapper">
            <span class="card-chevron-icon"></span>
            <div class="file-icon" style="background-image: url('/edsdme/img/icons/${this.getFileType(this.data.contentArea?.type)}.svg')"></div>
            <span class="card-title">${title}</span>
          </div>
          <div class="card-icons">
              <a class="card-btn"
                 daa-ll=${`Download | ${trackingTitle}`}
                 @click=${(e) => { e.stopPropagation(); }}
                 href=${isDlDisabled ? nothing : this.data.contentArea?.url}
                 download=${this.data.contentArea?.title}
                 aria-label=${this.localizedText['{{download}}']}
                 aria-disabled=${isDlDisabled}>
                <sp-icon-download class="icon" />
              </a>
              ${this.isPreviewEnabled(this.data.contentArea?.type)
                ? html`
                  <a class="card-btn"
                     daa-ll=${`Preview | ${trackingTitle}`}
                     @click=${(e) => { e.stopPropagation(); }}
                     href=${this.data.contentArea?.url}
                     target="_blank"
                     aria-label=${this.localizedText['{{open-in}}']}
                     aria-disabled=${false}>
                    <sp-icon-open-in class="icon"/>
                  </a>`
                : html`
                  <a class="card-btn" aria-disabled=${true} aria-label=${this.localizedText['{{open-in-disabled}}']}><sp-icon-open-in class="icon"/></a>`
              }
          </div>
        </div>

        <div class="card-content">
          ${this.data.styles?.backgroundImage
            ? html`
              <div class="card-img" style="background-image: url('${this.data.styles?.backgroundImage}')"
                   alt="${this.data.styles?.backgroundAltText}"></div>`
            : ''
          }
          <div class="card-text">
            <span class="card-date">${this.localizedText['{{last-modified}}']}
              : ${formatDate(this.data.cardDate, this.ietf)}
          ${this.data.contentArea?.type !== 'html' && this.data.contentArea?.type !== 'announcement'
            ? html`<span class="card-size">${this.localizedText['{{size}}']}: ${this.data.contentArea?.size}</span>`
            : ''
          }
            </span>
            <p class="card-description">${this.data.contentArea?.description}</p>
            <div class="card-tags-wrapper">${this.cardTags}</div>
          </div>
        </div>
      </div>
    `;
  }

  /* eslint-enable indent */
}

customElements.define('search-card', SearchCard);
