/**
 * Fetch-like response used by yukon-chat tests: replays a chunked JSON line stream
 * where `source` objects arrive on multiple lines (multiple footnotes, merge-by-document_id).
 *
 * Three documents: German PDF (refs 1+2), Partner guide (3+4), FAQ (5).
 */

/** Same document cited twice ([^1], [^2]) — accordion merges to "1, 2" */
const DOCUMENT_GERMAN = {
  document_id: '5633fc1b-9376-49e7-ac3f-a721328a0d42',
  document_name: 'DE-yukon-doc-distributor-china-education.pdf',
  document_url: 'https://example.com/mock-yukon-source.pdf',
  document_namespace: 'Dme-Partners-Stage',
  document_content:
    'German is the official and predominantly spoken language in Germany.[252] It is one of 24 official and working languages of the European Union, and one of the three procedural languages of the European Commission, alongside English and French.[253] German is the most widely spoken first language in the European Union, with around 100 million native speakers.[254]',
};

/** Second document, cited twice ([^3], [^4]) — merges to "3, 4" */
const DOCUMENT_PARTNER_GUIDE = {
  document_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  document_name: 'Adobe-Partner-Program-Overview.pdf',
  document_url: 'https://example.com/mock-partner-guide.pdf',
  document_namespace: 'Dme-Partners-Stage',
  document_content:
    'The Adobe Partner Program provides sales, marketing, and technical resources for resellers and solution partners.',
};

/** Third document, single citation [^5] */
const DOCUMENT_FAQ = {
  document_id: 'f0e1d2c3-b4a5-6978-90ab-cdef12345678',
  document_name: 'Partner-Portal-FAQ-Short.pdf',
  document_url: 'https://example.com/mock-partner-faq.pdf',
  document_namespace: 'Dme-Partners-Stage',
  document_content: 'Frequently asked questions about onboarding, certifications, and deal registration.',
};

const COL = ['COLLECTION'];

const emptySourceRow = (generatedText, streamComplete = false) => ({
  generated_text: generatedText,
  stream_complete: streamComplete,
  source_options: COL,
  attachments: [],
  reasoning_summary: null,
  response_event: null,
  source: {},
});

/** @param {{ signal?: AbortSignal }} [opts] */
export function createMockYukonMultiSourceResponse(opts = {}) {
  const { signal } = opts;
  const encoder = new TextEncoder();

  const row = (partial) => JSON.stringify([partial]);

  const bodyText = [
    row({
      generated_text: '',
      source: {},
      stream_complete: false,
      source_options: COL,
      attachments: [],
      reasoning_summary: 'Preparing context…',
      response_event: null,
    }),
    row(emptySourceRow('German is the')),
    row(emptySourceRow(' official and')),
    row(emptySourceRow(' predominantly')),
    row(emptySourceRow(' spoken language')),
    row(emptySourceRow(' in Germany')),
    row({
      generated_text: '. [^1] It',
      stream_complete: false,
      source_options: COL,
      attachments: [],
      source: { 1: DOCUMENT_GERMAN },
    }),
    row(emptySourceRow(' is also the')),
    row(emptySourceRow(' most widely')),
    row(emptySourceRow(' spoken first')),
    row(emptySourceRow(' language in')),
    row(emptySourceRow(' the European')),
    row(emptySourceRow(' Union, with')),
    row(emptySourceRow(' around 100')),
    row(emptySourceRow(' million native')),
    row(emptySourceRow(' speakers.')),
    row({
      generated_text: ' [^2]',
      stream_complete: false,
      source_options: COL,
      attachments: [],
      source: { 2: DOCUMENT_GERMAN },
    }),
    row(emptySourceRow('\n\nFor partners,')),
    row(emptySourceRow(' the program')),
    row(emptySourceRow(' outlines benefits')),
    row(emptySourceRow(' and requirements')),
    row(emptySourceRow(' in detail')),
    row({
      generated_text: '. [^3]',
      stream_complete: false,
      source_options: COL,
      attachments: [],
      source: { 3: DOCUMENT_PARTNER_GUIDE },
    }),
    row(emptySourceRow(' Related')),
    row(emptySourceRow(' onboarding steps')),
    row(emptySourceRow(' are summarized')),
    row(emptySourceRow(' in the same')),
    row(emptySourceRow(' guide')),
    row({
      generated_text: ' [^4]',
      stream_complete: false,
      source_options: COL,
      attachments: [],
      source: { 4: DOCUMENT_PARTNER_GUIDE },
    }),
    row(emptySourceRow('\n\nFor quick')),
    row(emptySourceRow(' answers,')),
    row(emptySourceRow(' see the FAQ')),
    row({
      generated_text: ' [^5]',
      stream_complete: false,
      source_options: COL,
      attachments: [],
      source: { 5: DOCUMENT_FAQ },
    }),
    row(emptySourceRow(' That covers the essentials.', true)),
  ].join('\n');

  const body = new ReadableStream({
    start(controller) {
      if (signal?.aborted) {
        controller.error(new DOMException('Aborted', 'AbortError'));
        return;
      }
      controller.enqueue(encoder.encode(`${bodyText}\n`));
      controller.close();
    },
    cancel() {
      /* consumer cancelled */
    },
  });

  return {
    ok: true,
    status: 200,
    body,
  };
}
