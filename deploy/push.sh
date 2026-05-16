#!/bin/bash
set -e

# Extract name and version from package.json (using sed to avoid Node dependency in minimal build envs)
PACKAGE_NAME=$(sed -n 's/.*"name": "@approvio\/\([^"]*\)".*/\1/p' package.json)
VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' package.json)

# Default registry and username (can be overridden by environment variables)
REGISTRY=${REGISTRY:-ghcr.io}
USERNAME=${USERNAME_PUSH:-giovannibaratta}

IMAGE_TAG="$REGISTRY/$USERNAME_PUSH/approvio-$PACKAGE_NAME:$VERSION"

echo "Pushing Docker image: $IMAGE_TAG"

docker push "$IMAGE_TAG"

echo "Push complete: $IMAGE_TAG"
