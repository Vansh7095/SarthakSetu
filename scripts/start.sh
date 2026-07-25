#!/bin/bash
set -e
# Start SarthakSetu in detached mode, rebuilding images if needed.
docker compose up -d --build
