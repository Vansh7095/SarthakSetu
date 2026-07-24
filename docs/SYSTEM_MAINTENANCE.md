# System Maintenance Guide — SarthakSetu (सार्थकसेतु)

> **Project**: Food donation platform connecting surplus food donors with NGOs and volunteers
> **Architecture**: React + Vite frontend, Express 5 + Drizzle ORM backend, PostgreSQL database
> **Auth**: Clerk (self-managed), OTP-based claim handover
> **Runtime**: Node.js 24, pnpm monorepo

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Server Requirements](#server-requirements)
3. [Installation](#installation)
4. [Updating](#updating)
5. [Monitoring](#monitoring)
6. [Logging](#logging)
7. [Backups](#backups)
8. [Disaster Recovery](#disaster-recovery)
9. [Scaling](#scaling)
10. [Performance Maintenance](#performance-maintenance)
11. [Security Maintenance](#security-maintenance)
12. [Docker Maintenance](#docker-maintenance)
13. [Android (Termux) Deployment](#android-termux-deployment)
14. [VPS Maintenance](#vps-maintenance)
15. [Maintenance Checklists](#maintenance-checklists)
16. [Troubleshooting](#troubleshooting)
17. [Long-Term Roadmap](#long-term-roadmap)

---

## System Overview

### Components

```
├── Frontend (sarthaksetu)
│   ├── React 19 + Vite 7
│   ├── Tailwind CSS v4
│   ├── wouter (routing)
│   ├── TanStack Query (data)
│   ├── Clerk (auth UI)
│   ├── Leaflet (maps)
│   └── Built to: dist/public/
│
├── Backend (api-server)
│   ├── Express 5
│   ├── Drizzle ORM + pg driver
│   ├── Clerk Express middleware
│   ├── pino (logging)
│   └── Bundled by esbuild to dist/index.mjs
│
├── Database
│   └── PostgreSQL (managed by platform or external)
│
└── External Services
    ├── Clerk (authentication)
    └── OpenStreetMap / Nominatim (geocoding)
```

### Services

| Service     | Type                       | Port        | Path             | Purpose          |
| ----------- | -------------------------- | ----------- | ---------------- | ---------------- |
| API Server  | Node.js/Express            | `PORT` env  | `/api/*`         | REST API         |
| Frontend    | Vite (dev) / Static (prod) | `PORT` env  | `/*` (non-API)   | SPA              |
| PostgreSQL  | Database                   | 5432        | Internal         | Data persistence |
| Clerk Proxy | Express middleware         | Same as API | `/api/__clerk/*` | Auth proxy       |

### Runtime

- **Node.js 24+** required for both frontend build and backend runtime
- **pnpm 9+** for workspace management and dependency installation
- **PostgreSQL 14+** for the database

### Startup Sequence

1. **Database boots** → PostgreSQL accepts connections
2. **Schema push** → `pnpm --filter @workspace/db run push` (deploy-time or first-run)
3. **Seed verification tables** ↔ `seedVerificationsIfEmpty()` runs on API startup (idempotent)
4. **API server boots** ↔ `index.ts` validates PORT, starts cleanup interval, binds to port
5. **Cleanup job starts** ↔ `setInterval(cleanupExpiredDonations, 300000)` ↔ deletes expired donations
6. **Frontend builds** ↔ `vite build` produces static files in `dist/public/`
7. **Reverse proxy routes** ↔ `/api/*` to API server, everything else to frontend static files

---

## Server Requirements

### Minimum (Development / Demo)

| Resource | Spec                                 |
| -------- | ------------------------------------ |
| CPU      | 1 core                               |
| RAM      | 512 MB                               |
| Storage  | 2 GB SSD                             |
| Network  | 10 Mbps                              |
| OS       | Linux (Ubuntu 22.04 LTS recommended) |

### Recommended (Production, < 1,000 active users)

| Resource | Spec                     |
| -------- | ------------------------ |
| CPU      | 2 cores                  |
| RAM      | 2 GB                     |
| Storage  | 10 GB SSD                |
| Network  | 100 Mbps                 |
| OS       | Linux (Ubuntu 24.04 LTS) |

### High Traffic (> 10,000 active users, > 1,000 donations/day)

| Resource | Spec                                                             |
| -------- | ---------------------------------------------------------------- |
| CPU      | 4+ cores                                                         |
| RAM      | 8 GB                                                             |
| Storage  | 50 GB SSD                                                        |
| Network  | 1 Gbps                                                           |
| Database | Separate PostgreSQL instance with connection pooling (PgBouncer) |
| Cache    | Redis instance (1 GB) for stats and session data                 |
| CDN      | Cloudflare or AWS CloudFront for static assets                   |

---

## Installation

### Prerequisites

```bash
# Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Git (if deploying from repo)
sudo apt-get install -y git
```

### Step-by-Step Production Installation

#### 1. Clone and Install

```bash
git clone <your-repo-url> /var/www/sarthaksetu
cd /var/www/sarthaksetu
pnpm install --frozen-lockfile
```

#### 2. Environment Setup

```bash
# Create production environment file
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgres://sarthaksetu:<password>@localhost:5432/sarthaksetu
PORT=8080
BASE_PATH=/
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
LOG_LEVEL=info
EOF

# Secure the env file
chmod 600 .env
```

#### 3. Database Setup

```bash
# Create database user and database
sudo -u postgres psql -c "CREATE USER sarthaksetu WITH PASSWORD '<strong-password>';"
sudo -u postgres psql -c "CREATE DATABASE sarthaksetu OWNER sarthaksetu;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sarthaksetu TO sarthaksetu;"

# Push schema
export $(cat .env | xargs)
pnpm --filter @workspace/db run push
```

#### 4. Build

```bash
# Generate API clients from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Build backend
pnpm --filter @workspace/api-server run build

# Build frontend
pnpm --filter @workspace/sarthaksetu run build
```

#### 5. Start with PM2

```bash
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: "sarthaksetu-api",
      script: "./artifacts/api-server/dist/index.mjs",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      instances: 1,
      exec_mode: "fork",
      log_file: "/var/log/sarthaksetu/api.log",
      error_file: "/var/log/sarthaksetu/api-error.log",
      out_file: "/var/log/sarthaksetu/api-out.log",
      max_memory_restart: "512M",
      restart_delay: 3000,
    },
  ],
};
EOF

# Create log directory
sudo mkdir -p /var/log/sarthaksetu
sudo chown $USER:$USER /var/log/sarthaksetu

# Start API
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
```

#### 6. Nginx Reverse Proxy

```bash
sudo apt-get install -y nginx

sudo tee /etc/nginx/sites-available/sarthaksetu << 'EOF'
server {
    listen 80;
    server_name sarthaksetu.org www.sarthaksetu.org;

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/sarthaksetu/artifacts/sarthaksetu/dist/public;
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/sarthaksetu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. HTTPS (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d sarthaksetu.org -d www.sarthaksetu.org
```

#### 8. Health Check

```bash
# Verify API is running
curl https://sarthaksetu.org/api/healthz
# Expected: {"status":"ok"}

# Verify frontend loads
curl -I https://sarthaksetu.org/
# Expected: HTTP/2 200
```

---

## Updating

### Frontend Update

```bash
cd /var/www/sarthaksetu
git pull origin main

# Rebuild frontend
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/sarthaksetu run build

# Restart PM2 (if serving static files from PM2)
pm2 restart sarthaksetu-api

# Or if using nginx to serve static files:
# No restart needed — nginx serves files directly
```

### Backend Update

```bash
cd /var/www/sarthaksetu
git pull origin main

# Rebuild everything
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
pnpm --filter @workspace/api-server run build

# Restart with zero-downtime (PM2 cluster mode for future)
pm2 reload sarthaksetu-api
```

### Database Schema Update

```bash
export $(cat /var/www/sarthaksetu/.env | xargs)
cd /var/www/sarthaksetu

# Review schema changes first
pnpm --filter @workspace/db run push -- --dry-run 2>/dev/null || echo "Review schema changes above"

# Apply changes
pnpm --filter @workspace/db run push
```

**Warning**: The project uses `drizzle-kit push`, which applies schema changes directly. For production with real data, consider using `drizzle-kit generate` to create migration files first, review them, then apply.

### Dependency Updates

```bash
cd /var/www/sarthaksetu

# Check outdated packages
pnpm outdated

# Update with workspace awareness
pnpm update --interactive

# Rebuild and test
pnpm run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/sarthaksetu run build

# Restart services
pm2 reload sarthaksetu-api
```

### Rollback Procedure

```bash
# 1. Stop current deployment
pm2 stop sarthaksetu-api

# 2. Rollback code
git log --oneline -10
git revert HEAD  # or git checkout <previous-commit>

# 3. Rebuild
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/sarthaksetu run build

# 4. Restart
pm2 start sarthaksetu-api

# 5. Verify health
curl https://sarthaksetu.org/api/healthz
```

**Database rollback**: If schema changes caused issues:

```bash
# Restore from pre-migration backup first
# Then re-apply old schema
git checkout <previous-commit> -- lib/db/src/schema/
pnpm --filter @workspace/db run push
```

---

## Monitoring

### CPU Monitoring

```bash
# Install htop for interactive monitoring
sudo apt-get install -y htop

# Or use PM2's built-in monitoring
pm2 monit

# For alerts, install atop
sudo apt-get install -y atop
```

**Recommended tool**: PM2 monitors Node.js CPU usage per process.

**Alert threshold**: CPU > 70% for 5 minutes.

### RAM Monitoring

```bash
# Check memory usage
free -h
pm2 status

# PM2 auto-restart on memory limit (configured in ecosystem.config.cjs)
max_memory_restart: "512M"
```

**Alert threshold**: RAM > 80% for 3 minutes.

### Logs

```bash
# PM2 logs
pm2 logs sarthaksetu-api

# Follow logs
pm2 logs sarthaksetu-api --lines 100

# JSON logs (pino format)
cat /var/log/sarthaksetu/api.log | npx pino-pretty
```

### Database Monitoring

```bash
# PostgreSQL connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Table sizes
sudo -u postgres psql -d sarthaksetu -c "
SELECT schemaname, relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC;
"

# Slow queries (if pg_stat_statements enabled)
sudo -u postgres psql -d sarthaksetu -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

**Recommended tool**: `pg_stat_statements` extension for query performance tracking.

### Error Tracking

Install Sentry or a similar error tracking service:

```bash
# Add to api-server dependencies
pnpm --filter @workspace/api-server add @sentry/node
```

Configure in `app.ts`:

```ts
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### Alerts Setup

Use UptimeRobot or similar for external health checks:

- Check `https://sarthaksetu.org/api/healthz` every 5 minutes
- Alert if HTTP ≠ 200 for 2 consecutive checks
- Alert if response time > 5 seconds

---

## Logging

### Log Locations

| Log Type     | Location                                | Format      |
| ------------ | --------------------------------------- | ----------- |
| API access   | `/var/log/sarthaksetu/api.log`          | JSON (pino) |
| API errors   | `/var/log/sarthaksetu/api-error.log`    | JSON (pino) |
| PM2 logs     | `~/.pm2/logs/`                          | Text        |
| Nginx access | `/var/log/nginx/sarthaksetu-access.log` | Combined    |
| Nginx errors | `/var/log/nginx/sarthaksetu-error.log`  | Text        |
| PostgreSQL   | `/var/log/postgresql/postgresql-*.log`  | Text        |

### Log Rotation

```bash
# Install logrotate
sudo apt-get install -y logrotate

sudo tee /etc/logrotate.d/sarthaksetu << 'EOF'
/var/log/sarthaksetu/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### Pino Log Format

The application uses structured JSON logging. Example:

```json
{
  "level": 30,
  "time": 1750000000000,
  "pid": 1234,
  "hostname": "server",
  "msg": "Server listening",
  "port": 8080
}
```

**To view pretty-printed logs**:

```bash
pm2 logs sarthaksetu-api | npx pino-pretty
```

### Sensitive Data Redaction

Pino is already configured to redact:

- `req.headers.authorization`
- `req.headers.cookie`
- `res.headers['set-cookie']`

**Verify this is working**:

```bash
curl -H "Authorization: Bearer test" https://sarthaksetu.org/api/users/me
grep "Bearer" /var/log/sarthaksetu/api.log
# Should return NO MATCHES
```

---

## Backups

### Database Backups

#### Automated Daily Backup

```bash
# Create backup script
sudo tee /usr/local/bin/backup-sarthaksetu-db << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/sarthaksetu"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sarthaksetu"
mkdir -p "$BACKUP_DIR"
pg_dump -Fc "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_${DATE}.dump"
# Keep only last 30 days
find "$BACKUP_DIR" -name "*.dump" -mtime +30 -delete
echo "Backup completed: ${DB_NAME}_${DATE}.dump"
EOF

sudo chmod +x /usr/local/bin/backup-sarthaksetu-db

# Schedule with cron
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-sarthaksetu-db") | crontab -
```

#### Manual Backup

```bash
# Full database backup
pg_dump -Fc sarthaksetu > sarthaksetu_backup_$(date +%Y%m%d).dump

# Schema-only backup
pg_dump -s sarthaksetu > sarthaksetu_schema_$(date +%Y%m%d).sql
```

### File Backups

```bash
# Backup the entire application
BACKUP_DIR="/var/backups/sarthaksetu/files"
DATE=$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/sarthaksetu_${DATE}.tar.gz" \
  /var/www/sarthaksetu/artifacts/api-server/dist/ \
  /var/www/sarthaksetu/artifacts/sarthaksetu/dist/public/ \
  /var/www/sarthaksetu/.env

# Sync to remote (example with rclone to S3)
# rclone sync "$BACKUP_DIR" remote:sarthaksetu-backups
```

### Environment Variables Backup

```bash
# Encrypt and store .env separately
gpg --symmetric --cipher-algo AES256 .env
cp .env.gpg /var/backups/sarthaksetu/env_$(date +%Y%m%d).gpg
```

### Restore Procedures

#### Database Restore

```bash
# Drop and recreate database (CAUTION: destroys current data)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS sarthaksetu;"
sudo -u postgres psql -c "CREATE DATABASE sarthaksetu OWNER sarthaksetu;"

# Restore from backup
pg_restore -d sarthaksetu /var/backups/sarthaksetu/sarthaksetu_20260115_020000.dump

# Or if plain SQL dump
psql -d sarthaksetu < /var/backups/sarthaksetu/sarthaksetu_backup.sql
```

#### Full Application Restore

```bash
# Stop services
pm2 stop sarthaksetu-api
sudo systemctl stop nginx

# Restore files
tar -xzf /var/backups/sarthaksetu/files/sarthaksetu_20260115.tar.gz -C /

# Restore env
cp /var/backups/sarthaksetu/env_20260115.gpg /var/www/sarthaksetu/
gpg --decrypt env_20260115.gpg > .env

# Restart
pm2 start sarthaksetu-api
sudo systemctl start nginx
```

### Backup Schedule

| Backup Type           | Frequency               | Retention    | Storage          |
| --------------------- | ----------------------- | ------------ | ---------------- |
| Database full         | Daily at 02:00          | 30 days      | Local + remote   |
| Application files     | Weekly (after deploy)   | 10 versions  | Local + remote   |
| Environment variables | After any change        | All versions | Encrypted remote |
| Database schema       | After any schema change | All versions | Git + remote     |

---

## Disaster Recovery

### Server Failure

| Scenario            | Recovery Steps                       | RTO          |
| ------------------- | ------------------------------------ | ------------ |
| API process crashes | PM2 auto-restarts within 3 seconds   | < 10 seconds |
| Full server crash   | Restore from latest backup to new VM | < 1 hour     |
| Disk failure        | Mount new disk, restore files + DB   | < 2 hours    |

**Runbook for total server replacement**:

1. Provision new server with same specs
2. Install Node.js, pnpm, PostgreSQL, nginx, PM2
3. Restore application files from backup
4. Restore database from latest `pg_dump`
5. Restore `.env` from encrypted backup
6. Update DNS to point to new server
7. Verify health check endpoint

### Database Corruption

```bash
# If database is corrupted but server is accessible
sudo -u postgres psql -c "DROP DATABASE sarthaksetu;"
sudo -u postgres psql -c "CREATE DATABASE sarthaksetu OWNER sarthaksetu;"
pg_restore -d sarthaksetu /var/backups/sarthaksetu/sarthaksetu_$(date -d yesterday +%Y%m%d)_020000.dump

# If pg_restore fails, use psql with plain SQL
psql -d sarthaksetu < /var/backups/sarthaksetu/sarthaksetu_backup.sql
```

**Point-in-time recovery** (if WAL archiving is enabled):

```bash
# Requires WAL archiving setup (not currently configured)
# This is a recommendation for future enhancement
```

### Lost Secrets

| Secret                  | Recovery                                          |
| ----------------------- | ------------------------------------------------- |
| `DATABASE_URL`          | Regenerate from PostgreSQL credentials            |
| `CLERK_SECRET_KEY`      | Generate new key from Clerk Dashboard             |
| `CLERK_PUBLISHABLE_KEY` | Copy from Clerk Dashboard (not sensitive)         |
| Server SSH keys         | Generate new key pair, update all authorized_keys |

**Store secrets in a password manager (1Password, Bitwarden, etc.) with shared team access.**

### Rollback Strategy

1. **Code rollback**: `git revert` or `git checkout` previous commit, rebuild, restart
2. **Database rollback**: Restore from pre-deployment backup, re-apply old schema
3. **Dependency rollback**: `pnpm install --frozen-lockfile` with previous lockfile
4. **Configuration rollback**: Restore `.env` from backup

**Golden rule**: Always take a database backup before schema changes.

### Recovery Time Objectives (RTO)

| Component   | RTO       | RPO                      |
| ----------- | --------- | ------------------------ |
| API server  | 5 minutes | N/A (stateless)          |
| Frontend    | 5 minutes | N/A (static files)       |
| Database    | 1 hour    | 24 hours (daily backups) |
| Full system | 2 hours   | 24 hours                 |

**To improve RPO to 1 hour**: Implement hourly incremental backups or streaming replication.

---

## Scaling

### Vertical Scaling

The simplest approach for moderate growth:

```
2 cores → 4 cores
2 GB RAM → 8 GB RAM
10 GB SSD → 50 GB SSD
```

No code changes needed. Just resize the VPS and restart PM2.

### Horizontal Scaling

For high traffic, run multiple API instances behind a load balancer:

```bash
# ecosystem.config.cjs for cluster mode
module.exports = {
  apps: [{
    name: "sarthaksetu-api",
    script: "./artifacts/api-server/dist/index.mjs",
    instances: "max",  # Uses all CPU cores
    exec_mode: "cluster",
    env: { NODE_ENV: "production", PORT: 8080 },
  }]
};
```

PM2 cluster mode handles load balancing across instances automatically.

### Load Balancing

**Nginx upstream configuration**:

```nginx
upstream sarthaksetu_api {
    server localhost:8080;
    server localhost:8081;
    server localhost:8082;
}

location /api/ {
    proxy_pass http://sarthaksetu_api/api/;
}
```

Run multiple PM2 instances on different ports, or use Docker with a load balancer.

### CDN

For static assets (frontend build output):

1. Upload `artifacts/sarthaksetu/dist/public/` to Cloudflare Pages, AWS S3 + CloudFront, or Vercel
2. Point DNS to CDN
3. Keep API on the origin server
4. Configure CORS on API to allow CDN domain

**Benefits**: Faster global load times, reduced origin server load, DDoS protection.

### Database Scaling

#### Read Replicas

For read-heavy workloads (donation browsing, stats):

```
Primary DB (writes) → Read Replica 1 (donation lists)
                  → Read Replica 2 (stats)
```

Drizzle ORM does not natively support read/write splitting. Implement at application level or use PgBouncer with routing.

#### Connection Pooling

Install PgBouncer between app and database:

```bash
sudo apt-get install -y pgbouncer
```

Configure `max_client_conn = 1000` and `default_pool_size = 20`.

---

## Performance Maintenance

### Cache Cleaning

The application has minimal caching:

- TanStack Query caches API responses in the browser (client-side, auto-expires)
- No server-side cache exists currently

**If Redis is added later**:

```bash
# Clear all cache
redis-cli FLUSHDB

# Or clear specific patterns
redis-cli KEYS "donations:*" | xargs redis-cli DEL
```

### Database Optimization

#### Monthly Tasks

```bash
# Update table statistics
sudo -u postgres psql -d sarthaksetu -c "ANALYZE;"

# Reindex tables
sudo -u postgres psql -d sarthaksetu -c "REINDEX TABLE donations;"
sudo -u postgres psql -d sarthaksetu -c "REINDEX TABLE claims;"
sudo -u postgres psql -d sarthaksetu -c "REINDEX TABLE users;"

# Vacuum to reclaim space
sudo -u postgres psql -d sarthaksetu -c "VACUUM FULL;"
```

#### Add Missing Indexes

Run after significant data growth:

```sql
CREATE INDEX CONCURRENTLY idx_donations_status ON donations(status);
CREATE INDEX CONCURRENTLY idx_donations_donor_id ON donations(donor_id);
CREATE INDEX CONCURRENTLY idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX CONCURRENTLY idx_claims_donation_id ON claims(donation_id);
CREATE INDEX CONCURRENTLY idx_claims_claimed_by ON claims(claimed_by_user_id);
```

Use `CONCURRENTLY` to avoid table locks during creation.

### Index Maintenance

Monitor index bloat:

```sql
SELECT schemaname, relname, n_dead_tup, n_live_tup,
       round(n_dead_tup::numeric/nullif(n_live_tup,0)*100, 2) as dead_pct
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

If dead tuple percentage > 10%, run `VACUUM`.

### Storage Cleanup

```bash
# Clean old PM2 logs
pm2 flush

# Clean old backups (keep 30 days)
find /var/backups/sarthaksetu -name "*.dump" -mtime +30 -delete

# Check disk usage
df -h
du -sh /var/www/sarthaksetu/*

# Clean npm cache
npm cache clean --force
```

### Memory Optimization

```bash
# Check for memory leaks
pm2 status  # Look for high memory usage

# If memory grows over time, restart nightly
(crontab -l 2>/dev/null; echo "0 3 * * * pm2 reload sarthaksetu-api") | crontab -
```

The cleanup job (`setInterval`) holds a reference. This is normal but monitor for leaks.

---

## Security Maintenance

### Certificate Renewal

Let's Encrypt certificates auto-renew, but verify:

```bash
# Check certificate expiry
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew --force-renewal
```

**Renewal is handled by a systemd timer automatically.**

### Dependency Updates

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit --fix

# Update critical packages
pnpm update drizzle-orm pg express

# Rebuild and redeploy
pnpm run typecheck
pnpm --filter @workspace/api-server run build
pm2 reload sarthaksetu-api
```

**Schedule**: Weekly automated check with Dependabot or Renovate.

### Secret Rotation

#### Clerk Keys

1. Generate new keys in Clerk Dashboard
2. Update `.env` with new values
3. Reload PM2: `pm2 reload sarthaksetu-api`
4. Verify app works
5. Revoke old keys in Clerk Dashboard

#### Database Password

```bash
# Generate new password
NEW_PASS=$(openssl rand -base64 24)

# Update PostgreSQL
sudo -u postgres psql -c "ALTER USER sarthaksetu WITH PASSWORD '${NEW_PASS}';"

# Update .env
sed -i "s|postgres://sarthaksetu:.*@|postgres://sarthaksetu:${NEW_PASS}@|" .env

# Restart API
pm2 reload sarthaksetu-api
```

**Rotation schedule**: Every 90 days for production.

### User Audits

```bash
# Count users by role
sudo -u postgres psql -d sarthaksetu -c "SELECT role, COUNT(*) FROM users GROUP BY role;"

# Find admin users
sudo -u postgres psql -d sarthaksetu -c "SELECT id, name, clerk_id, created_at FROM users WHERE role = 'admin';"

# Check for inactive donations
sudo -u postgres psql -d sarthaksetu -c "SELECT COUNT(*) FROM donations WHERE status = 'available' AND pickup_deadline < NOW();"
```

**Monthly**: Review admin accounts, verify no unauthorized admin creations.

### Firewall Maintenance

```bash
# Check current rules
sudo ufw status verbose

# Ensure only necessary ports are open
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw deny 5432  # Block external DB access

# Review and remove unused rules
sudo ufw status numbered
sudo ufw delete <rule-number>
```

---

## Docker Maintenance

### Dockerfile (Create if not exists)

```dockerfile
# Multi-stage build for the API
FROM node:24-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml package.json tsconfig*.json ./
COPY lib/ ./lib/
COPY artifacts/ ./artifacts/
RUN pnpm install --frozen-lockfile
RUN pnpm run typecheck
RUN pnpm --filter @workspace/api-server run build
RUN pnpm --filter @workspace/sarthaksetu run build

FROM node:24-slim AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/artifacts/api-server/dist ./api-server/dist
COPY --from=builder /app/artifacts/sarthaksetu/dist/public ./frontend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "api-server/dist/index.mjs"]
```

### Container Management

```bash
# Build
docker build -t sarthaksetu:latest .

# Run with env file
docker run -d \
  --name sarthaksetu-api \
  -p 8080:8080 \
  --env-file .env \
  --restart unless-stopped \
  sarthaksetu:latest

# View logs
docker logs -f sarthaksetu-api

# Restart
docker restart sarthaksetu-api

# Update
docker pull sarthaksetu:latest
docker stop sarthaksetu-api
docker rm sarthaksetu-api
docker run -d --name sarthaksetu-api -p 8080:8080 --env-file .env sarthaksetu:latest
```

### Image Updates

```bash
# Rebuild with latest dependencies
docker build --no-cache -t sarthaksetu:latest .

# Push to registry
docker tag sarthaksetu:latest registry.example.com/sarthaksetu:latest
docker push registry.example.com/sarthaksetu:latest
```

### Persistent Volumes

For database in Docker:

```bash
docker volume create sarthaksetu-postgres

docker run -d \
  --name sarthaksetu-db \
  -v sarthaksetu-postgres:/var/lib/postgresql/data \
  -e POSTGRES_USER=sarthaksetu \
  -e POSTGRES_PASSWORD=<password> \
  -e POSTGRES_DB=sarthaksetu \
  postgres:16-alpine
```

### Networking

```bash
# Create isolated network
docker network create sarthaksetu-network

# Connect containers
docker network connect sarthaksetu-network sarthaksetu-db
docker network connect sarthaksetu-network sarthaksetu-api
```

---

## Android (Termux) Deployment

### Why Termux?

Running on an Android phone with Termux is useful for:

- Low-cost personal demos
- Offline-capable community deployments
- Emergency backup hosting

### Setup

```bash
# In Termux
pkg update
pkg install nodejs postgresql pnpm git nginx

# Start PostgreSQL
pg_ctl -D $PREFIX/var/lib/postgresql start

# Create database
psql -U postgres -c "CREATE DATABASE sarthaksetu;"

# Clone and setup
git clone <repo-url>
cd workspace
pnpm install

# Set environment
export DATABASE_URL="postgres://postgres@localhost:5432/sarthaksetu"
export PORT=8080
export NODE_ENV=production
```

### PM2 in Termux

```bash
npm install -g pm2
pm2 start artifacts/api-server/dist/index.mjs --name api
pm2 save
```

### Cloudflare Tunnel (for public access)

```bash
# Install cloudflared
pkg install cloudflared

# Create tunnel
cloudflared tunnel create sarthaksetu

# Configure tunnel to localhost:8080
cloudflared tunnel route dns sarthaksetu your-domain.workers.dev

# Run tunnel
cloudflared tunnel run sarthaksetu
```

### Auto-Start on Boot

```bash
# Add to ~/.bashrc
echo "pg_ctl -D \$PREFIX/var/lib/postgresql start" >> ~/.bashrc
echo "pm2 resurrect" >> ~/.bashrc
```

### Backups

```bash
# Backup to internal storage
pg_dump -Fc sarthaksetu > /sdcard/Download/sarthaksetu_backup_$(date +%Y%m%d).dump

# Or sync to cloud
cp backup.dump /sdcard/Download/
# Then upload via Google Drive, Nextcloud, etc.
```

### Storage Management

```bash
# Check storage
df -h

# Clean npm cache
npm cache clean --force

# Remove old node_modules if needed
rm -rf node_modules/.pnpm-store
```

### Battery Optimization

- Disable battery optimization for Termux in Android settings
- Use `termux-wake-lock` to prevent sleep during operation
- Lower PM2 instances to 1
- Consider running only during daylight hours with a cron script

---

## VPS Maintenance

### Ubuntu Updates

```bash
# Weekly security updates
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get autoremove -y

# Check for reboot required
if [ -f /var/run/reboot-required ]; then
  echo "Reboot required"
fi
```

### SSH Hardening

```bash
sudo tee /etc/ssh/sshd_config.d/sarthaksetu.conf << 'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

sudo systemctl restart sshd
```

**Generate SSH key** (if not already):

```bash
ssh-keygen -t ed25519 -C "sarthaksetu-admin"
```

### UFW Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

### Nginx Maintenance

```bash
# Check config syntax
sudo nginx -t

# Reload gracefully
sudo systemctl reload nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Enable gzip compression
sudo tee /etc/nginx/conf.d/gzip.conf << 'EOF'
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
EOF

sudo systemctl reload nginx
```

### PM2 Maintenance

```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart all processes
pm2 restart all

# Save current process list
pm2 save

# Update PM2 itself
npm install -g pm2
pm2 update
```

### Docker on VPS

```bash
# Install Docker
sudo apt-get install -y docker.io docker-compose

# Run with docker-compose
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  api:
    image: sarthaksetu:latest
    env_file: .env
    ports:
      - "8080:8080"
    restart: unless-stopped
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./artifacts/sarthaksetu/dist/public:/usr/share/nginx/html
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
EOF

docker-compose up -d
```

---

## Maintenance Checklists

### Daily Checklist

- [ ] Check application is responding: `curl https://sarthaksetu.org/api/healthz`
- [ ] Check PM2 status: `pm2 status`
- [ ] Review error logs: `pm2 logs --lines 50 | grep ERROR`
- [ ] Check disk space: `df -h`
- [ ] Check memory usage: `free -h`

### Weekly Checklist

- [ ] Review all error logs for new issues
- [ ] Check database connection count
- [ ] Verify backup files exist and are valid
- [ ] Check for dependency updates: `pnpm outdated`
- [ ] Review nginx access logs for unusual traffic
- [ ] Check SSL certificate expiry: `certbot certificates`
- [ ] Verify firewall rules: `sudo ufw status`

### Monthly Checklist

- [ ] **Database maintenance**:
  - [ ] Run `ANALYZE` on all tables
  - [ ] Check index bloat
  - [ ] Review slow query log
- [ ] **Security**:
  - [ ] Run `pnpm audit`
  - [ ] Review admin user list
  - [ ] Check for exposed secrets in logs
  - [ ] Rotate database password (if 90-day cycle)
- [ ] **Performance**:
  - [ ] Review PM2 memory usage trends
  - [ ] Check donation table growth rate
  - [ ] Verify auto-cleanup is working
- [ ] **Backups**:
  - [ ] Test restore from backup (to staging)
  - [ ] Verify backup integrity
  - [ ] Clean old backups (> 30 days)
- [ ] **Dependencies**:
  - [ ] Update non-breaking dependencies
  - [ ] Review security advisories for all packages
- [ ] **Documentation**:
  - [ ] Update runbooks if procedures changed
  - [ ] Document any manual interventions

---

## Troubleshooting

### API Server Won't Start

```bash
# Check for missing env vars
node -e "console.log(require('process').env.PORT)"

# Check if port is in use
sudo lsof -i :8080

# Check build output exists
ls -la artifacts/api-server/dist/index.mjs

# Run manually to see errors
node artifacts/api-server/dist/index.mjs
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string
psql "$DATABASE_URL" -c "SELECT 1;"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Frontend Shows Blank Page

```bash
# Check build output
ls -la artifacts/sarthaksetu/dist/public/index.html

# Check nginx config
sudo nginx -t

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Verify BASE_PATH matches nginx location
```

### Clerk Authentication Not Working

```bash
# Verify keys are set
echo $CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Check Clerk proxy is responding
curl -I https://sarthaksetu.org/api/__clerk/

# Verify keys match Clerk Dashboard
# pk_live_... for production, pk_test_... for development
```

### High Memory Usage

```bash
# Find memory hogs
pm2 status  # Check mem column

# Check for memory leaks
# If API memory grows over days, restart
pm2 reload sarthaksetu-api

# Reduce cache TTL if Redis is used
```

### Donations Not Appearing on Map

```bash
# Check if donations exist in database
sudo -u postgres psql -d sarthaksetu -c "SELECT COUNT(*) FROM donations WHERE status = 'available';"

# Check if they have lat/lng
sudo -u postgres psql -d sarthaksetu -c "SELECT COUNT(*) FROM donations WHERE lat IS NULL OR lng IS NULL;"

# Check auto-cleanup isn't too aggressive
sudo -u postgres psql -d sarthaksetu -c "SELECT COUNT(*) FROM donations WHERE pickup_deadline < NOW();"
```

### 500 Errors on Claims

```bash
# Check for race conditions
pm2 logs | grep "claim"

# Verify donation status logic
sudo -u postgres psql -d sarthaksetu -c "
SELECT id, status, claimed_by_user_id FROM donations WHERE id = <problem-id>;
"

# Check for orphaned claims
sudo -u postgres psql -d sarthaksetu -c "
SELECT c.* FROM claims c
LEFT JOIN donations d ON c.donation_id = d.id
WHERE d.id IS NULL;
"
```

---

## Long-Term Roadmap

### Reliability

1. **Add database transactions** for claim/verify operations (prevents data inconsistency)
2. **Implement health check endpoint monitoring** with external service (UptimeRobot, Pingdom)
3. **Add database connection retry logic** with exponential backoff
4. **Implement graceful shutdown** — finish processing requests before exit
5. **Add request timeout middleware** — prevent hanging requests
6. **Implement circuit breaker** for external calls (Nominatim geocoding)

### Maintainability

1. **Add database migration files** — replace `push` with versioned migrations
2. **Implement API versioning** (`/api/v1/` prefix)
3. **Add comprehensive test suite** (unit, integration, E2E)
4. **Extract service layer** from route handlers
5. **Add API documentation** (Swagger UI from OpenAPI spec)
6. **Implement linting and formatting** (ESLint, Prettier)
7. **Add pre-commit hooks** for code quality

### Scalability

1. **Add Redis caching layer** for stats and donation lists
2. **Implement read replicas** for database queries
3. **Add CDN** for static assets and images
4. **Implement horizontal scaling** with PM2 cluster mode
5. **Add load balancer** (nginx upstream or AWS ALB)
6. **Implement database partitioning** by date for donations
7. **Add object storage** (S3/R2) for image uploads

### Observability

1. **Add structured application metrics** (Prometheus + Grafana)
2. **Implement distributed tracing** (Jaeger or OpenTelemetry)
3. **Add real-user monitoring (RUM)** for frontend performance
4. **Implement alerting** (PagerDuty, Opsgenie, or Slack webhooks)
5. **Add database performance dashboards**
6. **Implement log aggregation** (ELK stack or Loki + Grafana)
7. **Add error tracking** (Sentry integration)

### Production Readiness

1. **Implement rate limiting** on all endpoints
2. **Add Content Security Policy**
3. **Implement request validation middleware**
4. **Add audit logging** for admin actions
5. **Implement data retention policies**
6. **Add GDPR compliance** (data export, right to deletion)
7. **Implement backup encryption**
8. **Add staging environment** that mirrors production

---

> **End of System Maintenance Guide**
