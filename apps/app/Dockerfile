# The web image (#42): the app exported as a single-page web app, served by
# nginx at the domain's root; /api/* goes to the API container in front of it.
# Build from the repo root: docker build -f apps/app/Dockerfile .
FROM node:24-slim AS export

RUN corepack enable
WORKDIR /repo
COPY . .
# No lifecycle scripts: the root prepare is husky, and the rest set up native
# builds, which a web export does not need.
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @homelibra/app...
# No EXPO_PUBLIC_API_URL: on the web the app calls its own origin.
RUN cd apps/app && pnpm exec expo export --platform web --output-dir dist

FROM nginx:1.29-alpine

COPY apps/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=export /repo/apps/app/dist /usr/share/nginx/html
