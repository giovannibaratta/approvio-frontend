#!/bin/sh

# This script generates a config.js file from environment variables at container startup.
# This allows the frontend to be configured without rebuilding the image.

CONFIG_FILE="/app/public/config.js"

echo "window.APP_CONFIG = {" > $CONFIG_FILE

# List of environment variables to inject
# Format: JS_KEY: ENV_VAR_NAME

inject_var() {
    JS_KEY=$1
    ENV_VAR=$2

    # Use printenv instead of eval for safe, indirection-free variable lookup
    VALUE=$(printenv "$ENV_VAR")

    if [ ! -z "$VALUE" ]; then
        # Escape special characters for safe JavaScript string embedding
        # This prevents XSS if an environment variable contains quotes or script tags
        ESCAPED_VALUE=$(printf '%s' "$VALUE" | sed 's/\\/\\\\/g; s/"/\\"/g; s/</\\u003c/g; s/>/\\u003e/g')
        echo "  \"$JS_KEY\": \"$ESCAPED_VALUE\"," >> $CONFIG_FILE
    fi
}

inject_var "VITE_API_BASE_URL" "API_BASE_URL"
inject_var "VITE_AUTH_LOGIN_URL" "AUTH_LOGIN_URL"

# You can add more variables here as needed

echo "};" >> $CONFIG_FILE

echo "Generated runtime configuration at $CONFIG_FILE"

# Generate static-web-server configuration for custom headers
SWS_CONFIG_FILE="/app/sws.toml"
cat << 'EOF' > $SWS_CONFIG_FILE
[advanced]

[[advanced.headers]]
source = "**/*"
headers = { Content-Security-Policy = "frame-ancestors 'none';" }
EOF

echo "Generated server configuration at $SWS_CONFIG_FILE"

# Start the static web server
exec static-web-server \
    -w $SWS_CONFIG_FILE \
    --port 8080 \
    --root /app/public \
    --index-files index.html \
    --page-fallback /app/public/index.html \
    --security-headers true \
    --health true \
    --compression true \
    --log-level info \
    --log-forwarded-for true

