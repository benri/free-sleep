#!/bin/bash

# Optional: Exit immediately on error
set -e

# Name of the backup folder with a timestamp
print_json_if_exists() {
  local file_path="$1"
  local label="$2"

  if [ -f "$file_path" ]; then
    python3 -m json.tool "$file_path" \
      | sed 's/^/      /' \
      | sed $'s/^/\033[0;90m/' \
      | sed $'s/$/\033[0m/'
  else
    print_red "File not found: $file_path ❌"
  fi
}
print_json_if_exists "/home/dac/free-sleep/server/src/serverInfo.json" "Server info"

BACKUP_PATH="/home/dac/free-sleep-backup"
APP_DIR="/home/dac/free-sleep"

systemctl stop free-sleep
systemctl disable free-sleep

# Unblock internet first
sh /home/dac/free-sleep/scripts/unblock_internet_access.sh
trap 'bash /home/dac/free-sleep/scripts/block_internet_access.sh 2>/dev/null || true' EXIT

# If a free-sleep folder exists, back it up
if [ -d /home/dac/free-sleep ]; then
  echo "Backing up current free-sleep to $BACKUP_PATH"
  mv /home/dac/free-sleep $BACKUP_PATH
fi

echo "Attempting to reinstall free-sleep..."
INSTALL_URL="https://raw.githubusercontent.com/benri/free-sleep/main/scripts/install.sh"
curl -fsSL -o /tmp/free-sleep-install.sh "$INSTALL_URL"
echo "Downloaded installer checksum: $(sha256sum /tmp/free-sleep-install.sh)"
if /bin/bash /tmp/free-sleep-install.sh; then
  echo "Reinstall successful."
  rm -f /tmp/free-sleep-install.sh
  rm -rf "$BACKUP_PATH"
  if [ -d "$APP_DIR" ]; then
    rm -rf "$BACKUP_PATH"
  else
    echo "Install path missing after installer; restoring backup..."
    rm -rf "$APP_DIR"
    mv "$BACKUP_PATH" "$APP_DIR"
  fi
else
  echo "Reinstall failed. Restoring from backup..."
  rm -f /tmp/free-sleep-install.sh
  rm -rf /home/dac/free-sleep
  mv "$BACKUP_PATH" /home/dac/free-sleep
fi

systemctl enable free-sleep || true
systemctl start free-sleep || true

# Block internet access again
sh /home/dac/free-sleep/scripts/block_internet_access.sh
echo -e "\033[0;32mUpdate completed successfully!\033[0m"
echo -e "\033[0;32mRestart your pod with 'reboot -h now'\033[0m"
