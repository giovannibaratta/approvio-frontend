# Frontend Deployment and Containerization

This directory contains the configuration for building and publishing the Approvio Frontend using **Static Web Server (SWS)**.

- **Runtime Configuration**: Environment variables are injected at runtime via an `entrypoint.sh` script, allowing you to use the same image across different environments (Staging, Production) without rebuilding.

## Building the Image

Build the Docker image from the **root directory** of the frontend workspace using the provided script, which automatically extracts the name and version from `package.json`:

```bash
# Optional: Override the username or registry
# export USERNAME="your-username"
# export REGISTRY="your-registry"

./deploy/build.sh
```

## Publishing the Image

1. **Login to GHCR**:

   ```bash
   USERNAME="giovannibaratta"
   echo $GITHUB_TOKEN | docker login ghcr.io -u $USERNAME --password-stdin
   ```

2. **Push the Image**:
   ```bash
   ./deploy/push.sh
   ```

## Runtime Configuration

The container supports the following environment variables at runtime:

| Variable         | Description                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `API_BASE_URL`   | The base URL for the Approvio API (e.g., `https://api.approvio.io`).                          |
| `AUTH_LOGIN_URL` | Optional. The URL to redirect users for login (defaults to `${API_BASE_URL}/auth/web/login`). |

### Local Testing with Runtime Config

You can test the runtime configuration locally after building:

```bash
# Get the image tag from package.json
IMAGE_TAG="ghcr.io/giovannibaratta/approvio-frontend:$(node -p "require('./package.json').version")"

docker run -p 8080:8080 \
  -e API_BASE_URL="http://localhost:3000" \
  $IMAGE_TAG
```

## Kubernetes Integration

When deploying to Kubernetes, you can set these variables in your Deployment manifest. The `entrypoint.sh` script will automatically pick them up and inject them into the application.

```yaml
env:
  - name: API_BASE_URL
    value: "https://api.approvio.com"
```
