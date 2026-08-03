# SarthakSetu Documentation

This folder contains the project guides and technical references for SarthakSetu, a food donation platform connecting surplus food donors with NGOs and volunteers.

## Start here

| If you are... | Read this |
| --- | --- |
| Setting up the project for the first time | [Getting Started](./GETTING_STARTED.md) |
| Learning how the application is structured | [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) |
| Working with the database or schema | [Database Dictionary](./DATABASE_DICTIONARY.md) |
| Deploying or operating a live instance | [System Maintenance](./SYSTEM_MAINTENANCE.md) |
| Reviewing production-readiness risks | [Security Audit](./SECURITY_AUDIT.md) |
| Working specifically in Replit | [Replit project notes](../replit.md) |

## Documents

### Setup and development

- [Getting Started](./GETTING_STARTED.md) — beginner-friendly installation, environment configuration, database setup, first run, Docker, and deployment.
- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) — application architecture, frontend and backend internals, API behavior, configuration, diagrams, and deployment reference.

### Data and operations

- [Database Dictionary](./DATABASE_DICTIONARY.md) — tables, columns, enums, relationships, lifecycle behavior, and database-related API usage.
- [System Maintenance](./SYSTEM_MAINTENANCE.md) — monitoring, logging, backups, disaster recovery, scaling, Docker, VPS, and maintenance checklists.

### Security

- [Security Audit](./SECURITY_AUDIT.md) — source-code security findings, severity ratings, and recommended remediation areas.

## Documentation conventions

- Commands are shown from the repository root unless a section says otherwise.
- Keep secrets, local `.env` files, database passwords, and Clerk secret keys out of documentation and source control.
- Update the relevant guide when a workflow, environment variable, API contract, schema, or deployment procedure changes.
- Treat the security audit as a point-in-time assessment. Re-run a current review before deploying changes to production.
- Generated API clients under `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` must not be edited manually; update the OpenAPI contract and run `pnpm codegen` instead.

## Recommended reading order

1. [Getting Started](./GETTING_STARTED.md)
2. [Technical Documentation](./TECHNICAL_DOCUMENTATION.md)
3. [Database Dictionary](./DATABASE_DICTIONARY.md)
4. [System Maintenance](./SYSTEM_MAINTENANCE.md)
5. [Security Audit](./SECURITY_AUDIT.md)