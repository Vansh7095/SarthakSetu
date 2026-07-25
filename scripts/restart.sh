#!/bin/bash
set -e
# Restart all SarthakSetu services.
"$(dirname "$0")/stop.sh"
"$(dirname "$0")/start.sh"
