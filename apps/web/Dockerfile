# Local-proof default. Use Dockerfile.production for production-shaped builds.
FROM node:22-alpine

LABEL org.opencontainers.image.title="ER Pod Shift Simulator Web"
LABEL org.opencontainers.image.description="Operational simulation web editor; no PHI or EHR integration"
LABEL org.opencontainers.image.revision="manual-scenario-foundation-890-896"

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY tsconfig.base.json ./
COPY apps/web apps/web
COPY packages/shared packages/shared

WORKDIR /repo/apps/web

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
