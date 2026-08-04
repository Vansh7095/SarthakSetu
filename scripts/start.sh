#!/bin/bash
set -e
# Start SarthakSetu using the production-safe, SELinux-aware deployment flow.
bash "$(dirname "$0")/deploy.sh"
