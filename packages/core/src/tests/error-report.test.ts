import { describe, expect, it } from 'vitest';

import { scrubBreadcrumb, scrubEvent, scrubSpan } from '../error-report';

// What a scholar writes, searches or tags; none of it may reach an error report.
const searched = encodeURIComponent(JSON.stringify({ 0: { query: 'ʿulemâ ve kadı' } }));

describe('scrubEvent', () => {
  it('keeps the path of the request but drops its query, where tRPC carries a query’s input', () => {
    const event = scrubEvent({
      request: {
        url: `https://homelibra.com/api/trpc/search.library?batch=1&input=${searched}`,
        query_string: `batch=1&input=${searched}`,
        method: 'GET',
      },
    });

    expect(event.request).toEqual({ url: 'https://homelibra.com/api/trpc/search.library', method: 'GET' });
  });

  it('drops the body, cookies and headers of the request, where a mutation carries a Note and a session its token', () => {
    const event = scrubEvent({
      request: {
        url: 'https://homelibra.com/api/trpc/notes.capture?batch=1',
        method: 'POST',
        data: { 0: { excerpt: 'Kadı sicilinde geçen vakıf kaydı' } },
        cookies: { 'better-auth.session_token': 'secret' },
        headers: { cookie: 'better-auth.session_token=secret', 'user-agent': 'okhttp/4.12' },
      },
    });

    expect(event.request).toEqual({ url: 'https://homelibra.com/api/trpc/notes.capture', method: 'POST' });
  });

  it('keeps the SQL of a failed query but drops the parameters Drizzle appends to its message', () => {
    const event = scrubEvent({
      exception: {
        values: [
          {
            type: 'DrizzleQueryError',
            value:
              'Failed query: insert into "notes" ("id", "excerpt") values ($1, $2)\nparams: 0199,Kadı sicilinde geçen vakıf kaydı',
          },
          { type: 'PostgresError', value: 'deadlock detected' },
        ],
      },
    });

    expect(event.exception?.values).toEqual([
      { type: 'DrizzleQueryError', value: 'Failed query: insert into "notes" ("id", "excerpt") values ($1, $2)' },
      { type: 'PostgresError', value: 'deadlock detected' },
    ]);
  });

  it('scrubs the breadcrumbs it carries, which native code adds without passing through scrubBreadcrumb', () => {
    const event = scrubEvent({
      breadcrumbs: [
        { category: 'http', data: { url: `https://homelibra.com/api/trpc/search.library?input=${searched}` } },
      ],
    });

    expect(event.breadcrumbs).toEqual([
      { category: 'http', data: { url: 'https://homelibra.com/api/trpc/search.library' } },
    ]);
  });

  it('drops the query from the URLs a transaction’s fetch spans record', () => {
    const url = `https://homelibra.com/api/trpc/search.library?batch=1&input=${searched}`;
    const event = scrubEvent({
      spans: [
        {
          description: 'GET https://homelibra.com/api/trpc/search.library',
          data: {
            url,
            'http.url': url,
            'url.full': url,
            'http.query': `?batch=1&input=${searched}`,
            'http.method': 'GET',
          },
        },
      ],
    });

    const path = 'https://homelibra.com/api/trpc/search.library';
    expect(event.spans).toEqual([
      {
        description: 'GET https://homelibra.com/api/trpc/search.library',
        data: { url: path, 'http.url': path, 'url.full': path, 'http.method': 'GET' },
      },
    ]);
  });
});

describe('scrubBreadcrumb', () => {
  it('keeps the path of a fetched URL but drops its query', () => {
    expect(
      scrubBreadcrumb({
        category: 'fetch',
        data: {
          method: 'GET',
          url: `https://homelibra.com/api/trpc/search.library?input=${searched}`,
          status_code: 500,
        },
      }),
    ).toEqual({
      category: 'fetch',
      data: { method: 'GET', url: 'https://homelibra.com/api/trpc/search.library', status_code: 500 },
    });
  });

  it('keeps the paths of a web navigation but drops their queries', () => {
    expect(
      scrubBreadcrumb({ category: 'navigation', data: { from: '/ara?q=kad%C4%B1', to: '/notes/0199#excerpt' } }),
    ).toEqual({ category: 'navigation', data: { from: '/ara', to: '/notes/0199' } });
  });
});

describe('scrubSpan', () => {
  it('drops the query from the URLs a streamed span records, on the request served and on lookups sent', () => {
    const url = `https://homelibra.com/api/trpc/search.library?batch=1&input=${searched}`;
    const span = scrubSpan({
      name: 'GET /api/trpc/search.library',
      attributes: {
        'http.url': url,
        'url.full': url,
        'http.target': `/api/trpc/search.library?batch=1&input=${searched}`,
        'url.query': `batch=1&input=${searched}`,
        'http.query': `?batch=1&input=${searched}`,
        'http.request.method': 'GET',
      },
    });

    const path = 'https://homelibra.com/api/trpc/search.library';
    expect(span).toEqual({
      name: 'GET /api/trpc/search.library',
      attributes: {
        'http.url': path,
        'url.full': path,
        'http.target': '/api/trpc/search.library',
        'http.request.method': 'GET',
      },
    });
  });
});
