# Dependency Audit & Future Upgrades

This document tracks major version upgrades for our dependencies that involve breaking changes. We use it to decide whether an upgrade is worth the migration effort or if sticking to the current major version (while applying security patches) is the better approach based on modern best practices.

## 1. Express (v4 -> v5)

- **Current Version:** `4.22.x`
- **Latest Version:** `5.2.x`
- **Recommendation:** **Consider Transitioning (Low-Medium Priority)**
- **Reasoning:** Express 5 was recently released and introduces native support for Promises in route handlers, eliminating the need for packages like `express-async-handler`. Since this app heavily uses async routes, migrating to Express 5 would reduce boilerplate and external dependencies. However, Express 4 remains perfectly viable and extremely common. The migration will require refactoring error handling and route signatures.

## 2. Sequelize (v6 -> v7)

- **Current Version:** `6.37.x`
- **Latest Version:** `7.x` (Currently in Alpha/Beta)
- **Recommendation:** **Stay on v6 (for now)**
- **Reasoning:** Sequelize v7 is still largely in pre-release phases (`7.0.0-next.x`). It promises better TypeScript support and improved internals, but migrating now is premature. Sticking to v6 and applying security patches (like `6.37.8`) is the standard and safest approach for production applications until v7 becomes stable and widely adopted.

## 3. UUID (v11 -> v14)

- **Current Version:** `11.1.1`
- **Latest Version:** `14.x.x`
- **Recommendation:** **Low Priority**
- **Reasoning:** v14 drops support for older Node versions and changes export syntax. Since `11.1.1` contains the necessary security patches and minimizes breaking changes, there's no immediate need to upgrade to v14 unless new features are explicitly needed.

## 4. Vite (v7 -> v8)

- **Current Version:** `7.3.x`
- **Latest Version:** `8.1.x`
- **Recommendation:** **Low Priority**
- **Reasoning:** Vite 8 was recently released and requires modern Node versions while dropping some older legacy plugin APIs. Moving to `7.3.6` secures the app against path traversal without requiring a potentially breaking migration for the frontend build tools right now.

## 5. ESLint (v9 -> v10)

- **Current Version:** `9.39.x`
- **Latest Version:** `10.x.x`
- **Recommendation:** **Low Priority**
- **Reasoning:** ESLint 10 introduces breaking changes to the plugin ecosystem and drops support for older Node configurations. Since version `9.39.4` is stable and secures against transitive vulnerabilities (like `flatted`), migrating to v10 isn't immediately necessary unless adopting a plugin that strictly requires it.

## 6. SQLite3 (v5 -> v6)

- **Current Version:** `6.0.1`
- **Recommendation:** **Updated & Fixed**
- **Reasoning:** `sqlite3` was previously flagged as unfixable without breaking changes because it relied on ancient build tools (`tar`, `node-gyp`). Upgrading it manually to `v6.0.1` successfully cleared those vulnerabilities, and our backend test suite verified that the major version bump didn't break our local development setup!

## 7. Sequelize UUID Transitive Vulnerability

- **Recommendation:** **Ignore for now**
- **Reasoning:** `npm audit` flags the `uuid` package used internally by `sequelize` as vulnerable, and suggests `npm audit fix --force` which downgrades `sequelize` to an ancient version (v3.30.0) just to resolve it. This is a known false-positive/nuisance in the audit ecosystem; we will stay on the secure v6 branch of Sequelize and accept the internal UUID warning.
