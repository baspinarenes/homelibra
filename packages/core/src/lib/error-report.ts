// What may leave for the error tracker (Sentry) from the app and the API.
// No Library content does (#40): a Note's text, a Source's title, a Tag's
// name or a search reaches the tracker only by accident, through a URL, a
// body or an error message, so those are cut here, for both SDKs alike.

/** Breadcrumbs and spans: their `data` is where the SDKs record URLs. */
export interface ReportedData {
  data?: { [key: string]: unknown };
}

/** A streamed span (API, SDK 11): it records URLs in `attributes`. */
export interface ReportedSpan {
  attributes?: { [key: string]: unknown };
}

/** The parts of a Sentry event we cut; the rest passes as it is. */
export interface ReportedEvent {
  request?: { url?: string; method?: string };
  exception?: { values?: { value?: string }[] };
  breadcrumbs?: ReportedData[];
  spans?: ReportedData[];
}

/** A URL without its query and fragment: tRPC sends a query's input there. */
function withoutQuery(url: string) {
  return url.replace(/[?#].*$/s, '');
}

/** Drizzle's "Failed query: <sql>\nparams: <values>"; the SQL has only placeholders. */
function withoutQueryParams(message: string) {
  return message.replace(/\nparams: .*$/s, '');
}

/**
 * Where URLs are kept: fetch, xhr and http breadcrumbs under `url`, web
 * navigations under `from` and `to`, spans under `url`, `http.url`,
 * `url.full` and, for the request served, `http.target`. A span's
 * `http.query` and `url.query` are the query alone.
 */
const URL_KEYS = ['url', 'from', 'to', 'http.url', 'url.full', 'http.target'];
const QUERY_KEYS = ['http.query', 'url.query'];

function scrubUrls(record: { [key: string]: unknown }) {
  const scrubbed = { ...record };
  for (const key of URL_KEYS) {
    const value = scrubbed[key];
    if (typeof value === 'string') scrubbed[key] = withoutQuery(value);
  }
  for (const key of QUERY_KEYS) delete scrubbed[key];
  return scrubbed;
}

function scrubData<D extends ReportedData>(item: D): D {
  return item.data ? { ...item, data: scrubUrls(item.data) } : item;
}

/** For `beforeSend` and `beforeSendTransaction`: the event without Library content. */
export function scrubEvent<E extends ReportedEvent>(event: E): E {
  const scrubbed = { ...event };
  if (event.request) {
    // Of the request only the route stays: bodies carry Notes, headers and
    // cookies the session.
    const { url, method } = event.request;
    scrubbed.request = {
      ...(url !== undefined && { url: withoutQuery(url) }),
      ...(method !== undefined && { method }),
    };
  }
  if (event.exception?.values) {
    scrubbed.exception = {
      ...event.exception,
      values: event.exception.values.map((e) =>
        e.value === undefined ? e : { ...e, value: withoutQueryParams(e.value) },
      ),
    };
  }
  if (event.breadcrumbs) scrubbed.breadcrumbs = event.breadcrumbs.map(scrubData);
  if (event.spans) scrubbed.spans = event.spans.map(scrubData);
  return scrubbed;
}

/** For `beforeBreadcrumb`: the breadcrumb without the queries of its URLs. */
export function scrubBreadcrumb<B extends ReportedData>(breadcrumb: B): B {
  return scrubData(breadcrumb);
}

/** For `beforeSendSpan`: the span without the queries of its URLs. */
export function scrubSpan<S extends ReportedSpan>(span: S): S {
  return span.attributes ? { ...span, attributes: scrubUrls(span.attributes) } : span;
}
