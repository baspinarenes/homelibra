// What may leave for the error tracker (Sentry) from the app and the API.
// No Library content does (#40): a Note's text, a Source's title, a Tag's
// name or a search reaches the tracker only by accident, through a URL, a
// body or an error message, so those are cut here, for both SDKs alike.

/** The parts of a Sentry event we cut; the rest passes as it is. */
export interface ReportedEvent {
  request?: { url?: string; method?: string };
  exception?: { values?: { value?: string }[] };
  breadcrumbs?: ReportedBreadcrumb[];
}

/** A URL without its query and fragment: tRPC sends a query's input there. */
function withoutQuery(url: string) {
  return url.replace(/[?#].*$/s, '');
}

/** Drizzle's "Failed query: <sql>\nparams: <values>"; the SQL has only placeholders. */
function withoutQueryParams(message: string) {
  return message.replace(/\nparams: .*$/s, '');
}

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
  if (event.breadcrumbs) scrubbed.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  return scrubbed;
}

export interface ReportedBreadcrumb {
  data?: { [key: string]: unknown };
}

/** Where breadcrumbs keep URLs: fetch, xhr and http under `url`, web navigations under `from` and `to`. */
const URL_KEYS = ['url', 'from', 'to'];

export function scrubBreadcrumb<B extends ReportedBreadcrumb>(breadcrumb: B): B {
  if (!breadcrumb.data) return breadcrumb;
  const data = { ...breadcrumb.data };
  for (const key of URL_KEYS) {
    const value = data[key];
    if (typeof value === 'string') data[key] = withoutQuery(value);
  }
  return { ...breadcrumb, data };
}
