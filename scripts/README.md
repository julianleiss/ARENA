# ARENA Scripts

This directory contains utility scripts for development workflows.

## iteration.sh

One-command routine for managing iterations following the global acceptance criteria.

### Usage

```bash
npm run iteration -- <command> [options]
```

### Commands

#### Start New Iteration
Creates a new branch following naming conventions:

```bash
npm run iteration -- start <type> <id> <description>
```

**Parameters:**
- `type`: `chore`, `feat`, or `fix`
- `id`: Iteration identifier (e.g., `i12`)
- `description`: Short description in kebab-case

**Example:**
```bash
npm run iteration -- start feat i12 user-profiles
```

This creates and switches to branch: `feat/i12-user-profiles`

#### Build and Verify
Runs database generation and project build:

```bash
npm run iteration -- build
```

- Automatically detects Prisma schema changes
- Runs `npm run db:generate` and `npm run db:push` if schema changed
- Runs `npm run build` to verify no errors

#### Dev Server
Starts development server for smoke testing:

```bash
npm run iteration -- dev
```

Press Ctrl+C when done testing.

#### Commit Changes
Stages all changes and creates formatted commit:

```bash
npm run iteration -- commit "Your commit message"
```

Commit format:
```
<type>(<id>): <message>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Push to Origin
Pushes current branch to remote:

```bash
npm run iteration -- push
```

Uses `-u origin <branch>` if branch doesn't exist on remote.

#### Create Pull Request
Opens PR using GitHub CLI:

```bash
npm run iteration -- pr
```

**Requirements:**
- GitHub CLI (`gh`) must be installed
- Automatically uses PR template from `.github/pull_request_template.md`
- Opens PR in browser after creation

#### Complete Workflow
Runs full iteration workflow:

```bash
npm run iteration -- complete "Your commit message"
```

**Steps:**
1. Build and verify
2. Commit changes
3. Push to origin
4. Prompt to create PR

### Global Acceptance Criteria

Every iteration must meet these criteria:

✓ `npm run build` completes without errors
✓ `npm run dev` runs successfully
✓ ESLint clean (no blocking errors)
✓ Each iteration leaves visible path/action
✓ PR per iteration with checklist + evidence

### Branch Naming Convention

All branches must follow this pattern:

```
<type>/<id>-<description>
```

**Types:**
- `chore` - Maintenance, refactoring, tooling
- `feat` - New features
- `fix` - Bug fixes

**Examples:**
- `chore/i10-reusable-snippets`
- `feat/i12-user-profiles`
- `fix/i13-map-rendering-bug`

### Workflow Example

Complete iteration from start to finish:

```bash
# 1. Start new iteration
npm run iteration -- start feat i12 user-profiles

# 2. Apply iteration tasks (edit code, add features)
# ... make your changes ...

# 3. Build and verify
npm run iteration -- build

# 4. Smoke test
npm run iteration -- dev
# Test the feature, press Ctrl+C when done

# 5. Complete workflow (commit + push + PR)
npm run iteration -- complete "Implement user profile pages with avatar upload"
```

### Troubleshooting

**"Branch must start with chore/, feat/, or fix/"**
- Ensure you're on a properly named branch
- Use `npm run iteration -- start` to create correct branch

**"GitHub CLI (gh) not installed"**
- Install with: `brew install gh` (macOS)
- Or follow: https://cli.github.com/manual/installation

**"You have uncommitted changes"**
- Script will prompt to stash changes before creating new branch
- Changes are auto-stashed with descriptive message

## Other Scripts

### seed.ts

Populates database with test data:

```bash
npm run db:seed
```

Creates:
- Test users (citizen and expert)
- POIs in Buenos Aires Núñez area
- Sample proposals

### rollback.ts

**⚠️ CAUTION:** Deletes all data from database:

```bash
npm run db:rollback
```

Respects foreign key constraints and deletes in correct order.

Use only in development when you need a clean slate.

### migrate-production.ts

Production database migration script (future use).
