#!/bin/bash
set -e
# Pull the latest code and redeploy SarthakSetu.
git pull
docker compose up -d --build
