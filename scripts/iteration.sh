#!/usr/bin/env bash
# ARENA V1.0 - Iteration Routine Script
# One-command workflow for iterations: branch, build, commit, push, PR

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Usage
usage() {
  cat <<EOF
Usage: npm run iteration -- <command> [options]

Commands:
  start <type> <id> <desc>    Start new iteration
                               type: chore|feat|fix
                               id: iteration number (e.g., i12)
                               desc: short description (kebab-case)

  build                        Build and verify (db:generate + build)

  dev                          Start dev server for smoke test

  commit <message>             Commit changes with formatted message

  push                         Push current branch to origin

  pr                           Open pull request (requires gh CLI)

  complete <message>           Full workflow: build + commit + push + pr

Examples:
  npm run iteration -- start feat i12 user-profiles
  npm run iteration -- build
  npm run iteration -- commit "Add user profile component"
  npm run iteration -- complete "Implement user profiles"

Global Acceptance Criteria:
  • npm run build without errors
  • npm run dev runs successfully
  • ESLint clean (no blocking errors)
  • Each iteration leaves visible path/action
  • PR per iteration with checklist + evidence
EOF
}

# Get current branch name
get_current_branch() {
  git branch --show-current
}

# Check if branch follows naming convention
validate_branch_name() {
  local branch=$1
  if [[ ! $branch =~ ^(chore|feat|fix)/ ]]; then
    error "Branch must start with chore/, feat/, or fix/"
    return 1
  fi
  return 0
}

# Start new iteration
cmd_start() {
  local type=$1
  local id=$2
  local desc=$3

  if [[ -z $type || -z $id || -z $desc ]]; then
    error "Missing arguments"
    echo "Usage: npm run iteration -- start <type> <id> <desc>"
    exit 1
  fi

  # Validate type
  if [[ ! $type =~ ^(chore|feat|fix)$ ]]; then
    error "Type must be: chore, feat, or fix"
    exit 1
  fi

  # Create branch name
  local branch="${type}/${id}-${desc}"

  info "Starting iteration: ${branch}"

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    warning "You have uncommitted changes"
    read -p "Stash changes and continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git stash push -m "Auto-stash before ${branch}"
      success "Changes stashed"
    else
      error "Aborted"
      exit 1
    fi
  fi

  # Create and checkout branch
  git checkout -b "$branch"
  success "Created and switched to branch: ${branch}"

  info "Branch created! Next steps:"
  echo "  1. Apply iteration tasks"
  echo "  2. Run: npm run iteration -- build"
  echo "  3. Run: npm run iteration -- dev (smoke test)"
  echo "  4. Run: npm run iteration -- complete 'your message'"
}

# Build and verify
cmd_build() {
  info "Running build verification..."

  # Check if schema changed (basic heuristic)
  if git diff --name-only HEAD | grep -q "prisma/schema.prisma"; then
    info "Prisma schema changed, running db:generate and db:push..."
    npm run db:generate
    npm run db:push
    success "Database schema updated"
  else
    info "Running db:generate (schema unchanged)..."
    npm run db:generate
  fi

  # Run build
  info "Building project..."
  npm run build

  success "Build completed successfully!"
}

# Start dev server
cmd_dev() {
  info "Starting dev server for smoke test..."
  warning "Press Ctrl+C to stop when done testing"
  npm run dev
}

# Commit changes
cmd_commit() {
  local message=$1

  if [[ -z $message ]]; then
    error "Commit message required"
    echo "Usage: npm run iteration -- commit 'your message'"
    exit 1
  fi

  local branch=$(get_current_branch)

  # Validate branch
  if ! validate_branch_name "$branch"; then
    exit 1
  fi

  # Extract type and id from branch name
  local type=$(echo "$branch" | cut -d'/' -f1)
  local id=$(echo "$branch" | cut -d'/' -f2 | cut -d'-' -f1)

  # Show status
  info "Current changes:"
  git status --short

  read -p "Add all changes and commit? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Aborted"
    exit 1
  fi

  # Stage all changes
  git add .

  # Create commit with template
  git commit -m "$(cat <<EOF
${type}(${id}): ${message}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

  success "Changes committed"
  git log --oneline -1
}

# Push to origin
cmd_push() {
  local branch=$(get_current_branch)

  if ! validate_branch_name "$branch"; then
    exit 1
  fi

  info "Pushing branch: ${branch}"

  # Check if branch exists on remote
  if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
    git push
  else
    git push -u origin "$branch"
  fi

  success "Branch pushed to origin"
}

# Create pull request
cmd_pr() {
  local branch=$(get_current_branch)

  if ! validate_branch_name "$branch"; then
    exit 1
  fi

  # Check if gh CLI is installed
  if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) not installed"
    echo "Install with: brew install gh"
    exit 1
  fi

  # Extract info from branch
  local type=$(echo "$branch" | cut -d'/' -f1)
  local id=$(echo "$branch" | cut -d'/' -f2 | cut -d'-' -f1)
  local desc=$(echo "$branch" | cut -d'/' -f2 | cut -d'-' -f2-)

  # Get last commit message
  local commit_msg=$(git log -1 --pretty=%B | head -n1)

  info "Creating pull request..."
  info "Title: ${commit_msg}"

  # Create PR (will use template automatically)
  gh pr create --title "$commit_msg" --body ""

  success "Pull request created!"

  # Open PR in browser
  gh pr view --web
}

# Complete workflow
cmd_complete() {
  local message=$1

  if [[ -z $message ]]; then
    error "Commit message required"
    echo "Usage: npm run iteration -- complete 'your message'"
    exit 1
  fi

  info "Running complete workflow..."

  # Build
  cmd_build

  # Commit
  cmd_commit "$message"

  # Push
  cmd_push

  # PR
  read -p "Create pull request? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cmd_pr
  fi

  success "Iteration complete!"
}

# Main command router
main() {
  local command=$1
  shift

  case $command in
    start)
      cmd_start "$@"
      ;;
    build)
      cmd_build "$@"
      ;;
    dev)
      cmd_dev "$@"
      ;;
    commit)
      cmd_commit "$@"
      ;;
    push)
      cmd_push "$@"
      ;;
    pr)
      cmd_pr "$@"
      ;;
    complete)
      cmd_complete "$@"
      ;;
    help|--help|-h|"")
      usage
      ;;
    *)
      error "Unknown command: $command"
      echo ""
      usage
      exit 1
      ;;
  esac
}

main "$@"
