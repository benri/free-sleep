#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/../server"

# Use --local flag for local development
if [ "$1" = "--local" ]; then
  ENV_FILE="$SERVER_DIR/.env.local"
else
  ENV_FILE="$SERVER_DIR/.env.pod"
fi

# Prompt for username
read -rp "Admin username: " USERNAME
if [ -z "$USERNAME" ]; then
  echo "Error: Username cannot be empty"
  exit 1
fi

# Prompt for password
read -rsp "Admin password: " PASSWORD
echo
if [ ${#PASSWORD} -lt 6 ]; then
  echo "Error: Password must be at least 6 characters"
  exit 1
fi

# Generate JWT_SECRET in .env.pod if not present
if ! grep -q "^JWT_SECRET=.\+" "$ENV_FILE" 2>/dev/null; then
  SECRET=$(openssl rand -hex 32)
  if grep -q "^JWT_SECRET=" "$ENV_FILE" 2>/dev/null; then
    TMP_FILE=$(mktemp)
    sed "s/^JWT_SECRET=.*/JWT_SECRET=$SECRET/" "$ENV_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$ENV_FILE"
  else
    echo "JWT_SECRET=$SECRET" >> "$ENV_FILE"
  fi
  echo "Generated JWT_SECRET in $ENV_FILE"
fi

# Create the admin user
cd "$SERVER_DIR"
npx dotenv -e "$ENV_FILE" -- node --loader ts-node/esm src/auth/createAdmin.ts "$USERNAME" "$PASSWORD"

# Generate SERVICE_TOKEN if not present
if ! grep -q "^SERVICE_TOKEN=.\+" "$ENV_FILE" 2>/dev/null; then
  TOKEN=$(npx dotenv -e "$ENV_FILE" -- node --loader ts-node/esm src/auth/generateServiceToken.ts)
  if grep -q "^SERVICE_TOKEN=" "$ENV_FILE" 2>/dev/null; then
    TMP_FILE=$(mktemp)
    sed "s/^SERVICE_TOKEN=.*/SERVICE_TOKEN=$TOKEN/" "$ENV_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$ENV_FILE"
  else
    echo "SERVICE_TOKEN=$TOKEN" >> "$ENV_FILE"
  fi
  echo "Generated SERVICE_TOKEN in $ENV_FILE"
fi
