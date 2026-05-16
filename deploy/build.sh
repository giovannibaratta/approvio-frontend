#!/bin/bash
set -e

# Extract name and version from package.json (using sed to avoid Node dependency in minimal build envs)
PACKAGE_NAME=$(sed -n 's/.*"name": "@approvio\/\([^"]*\)".*/\1/p' package.json)
VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' package.json)

# Default registry and username (can be overridden by environment variables)
REGISTRY=${REGISTRY:-ghcr.io}
USERNAME=${USERNAME:-giovannibaratta}

IMAGE_TAG="$REGISTRY/$USERNAME/approvio-$PACKAGE_NAME:$VERSION"

echo "Building Docker image: $IMAGE_TAG"

docker build -t "$IMAGE_TAG" -f deploy/Dockerfile .

echo "Build complete: $IMAGE_TAG"
