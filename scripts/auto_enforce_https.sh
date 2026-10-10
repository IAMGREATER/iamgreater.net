#!/usr/bin/env bash
# Auto-enforce HTTPS once Let's Encrypt certificate is issued by GitHub Pages
for i in {1..30}; do
    STATUS=$(gh api -X PUT repos/IAMGREATER/iamgreater.net/pages -F https_enforced=true 2>&1)
    if [[ "$STATUS" != *"The certificate does not exist yet"* ]] && [[ "$STATUS" != *"error"* ]]; then
        echo "[$(date)] HTTPS Successfully Enforced!"
        exit 0
    fi
    sleep 60
done
echo "[$(date)] Still pending after 30 minutes."
