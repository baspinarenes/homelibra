# The web image (#42): the app exported as a single-page web app, served by
# nginx at the domain's root; /api/* goes to the API container in front of it.
# Build from the repo root: docker build -f apps/app/Dockerfile .
FROM node:24-slim AS export

# The slim image has no root certificates, and sentry-cli needs them.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates
RUN corepack enable
WORKDIR /repo
COPY . .
# No lifecycle scripts: the root prepare is husky, and the rest set up native
# builds, which a web export does not need.
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @homelibra/app...
# No EXPO_PUBLIC_API_URL: on the web the app calls its own origin.
RUN cd apps/app && pnpm exec expo export --platform web --output-dir dist --source-maps
# The source maps go to Sentry (#76) and stop there: nginx never gets them. The
# token is a build secret, so no layer of the image holds it. A local build has
# none and skips the upload; a failed upload warns and does not stop a deploy.
RUN --mount=type=secret,id=sentry_auth_token cd apps/app \
  && if [ -s /run/secrets/sentry_auth_token ]; then \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)" pnpm exec sentry-expo-upload-sourcemaps dist \
      || echo 'warning: the source maps did not reach Sentry; this release of the web app reports minified stacks.'; \
  else \
    echo 'No Sentry token: source maps not uploaded.'; \
  fi \
  && find dist -name '*.map' -delete

FROM nginx:1.29-alpine

COPY apps/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=export /repo/apps/app/dist /usr/share/nginx/html
