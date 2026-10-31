# The API image (#42): the API and the workspace packages it imports, run by
# tsx as in development, so there is no build step to drift from the tests.
# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM node:24-slim AS deploy

RUN corepack enable
WORKDIR /repo
COPY . .
# `pnpm deploy` copies the API with only its production dependencies, the
# workspace packages it imports among them. A filtered install would not:
# the hoisted linker (pnpm-workspace.yaml) installs the whole workspace,
# Expo too. No lifecycle scripts: the root prepare is husky, a dev tool, and
# sharp and esbuild ship their binaries as optional packages.
RUN pnpm --config.node-linker=isolated --config.inject-workspace-packages=true --filter @homelibra/api deploy --prod --frozen-lockfile --ignore-scripts /api

FROM node:24-slim

ENV NODE_ENV=production
ENV PATH=/api/node_modules/.bin:$PATH
COPY --from=deploy /api /api

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

USER node
WORKDIR /api
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://localhost:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["./start.sh"]
