# --- Builder Stage ---
FROM node:22-alpine3.22 AS builder

# Enable corepack for Yarn berry
RUN corepack enable

WORKDIR /app

# Copy configuration files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js postcss.config.js ./
COPY components.json ./

# Copy source code and assets
COPY index.html ./
COPY public ./public
COPY src ./src

# Install dependencies and build
# We set VITE_API_BASE_URL to a placeholder or empty during build 
# because it will be overridden at runtime by config.js
RUN yarn install --frozen-lockfile
RUN yarn build

# --- Runner Stage ---
# Using the Rust-based Static Web Server for enhanced security and performance
FROM joseluisq/static-web-server:2.42-alpine

WORKDIR /app

# Copy the built assets from the builder stage
# We put them in /app/public
COPY --from=builder /app/dist ./public

# Copy the entrypoint script
COPY deploy/entrypoint.sh ./entrypoint.sh

# Ensure the public directory is writable by the server user so it can generate config.js
# The default user for the SWS image is 'sws' (uid 1000)
USER root
RUN chmod +x ./entrypoint.sh && \
    chown -R 1000:1000 /app/public

USER 1000

# Expose the default SWS port
EXPOSE 8080

# Use the entrypoint script to inject environment variables at runtime
ENTRYPOINT ["./entrypoint.sh"]
