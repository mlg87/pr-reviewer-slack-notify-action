---
name: generating-commit-messages
description: Generates atomic commits in dependency order with intelligent type and scope detection using conventional commit format. Use when committing changes, reviewing staged files, or organizing multiple related changes into separate commits.
---

# Commit Helper

Atomically commit related changes in dependency order with intelligent type and scope detection.

## Instructions

When committing changes, follow this process:

### 1. Analyze All Changes

First, gather the full picture:

```bash
git status
git diff --staged --name-only
git diff --name-only
```

### 2. Group Changes by Logical Unit

Group files that should be committed together based on:

- **Shared purpose**: Files that implement a single feature/fix together
- **Dependencies**: Configuration files that enable new code (e.g., package.json before source files)
- **Logical coupling**: Types/interfaces with their implementations

### 3. Determine Commit Order (Dependency-Based)

Commit in this order to maintain a buildable state at each commit:

1. **Configuration/Dependencies first**

   - `package.json`, `yarn.lock`, `package-lock.json`
   - Config files (`.eslintrc.*`, `tsconfig.json`, `vite.config.*`, etc.)
   - Environment files

2. **Types/Interfaces second**

   - Type definition files (`*.d.ts`, `types/*.ts`)
   - Shared interfaces and contracts

3. **Utilities/Helpers third**

   - Shared utility functions
   - Helper modules
   - Constants

4. **Core implementation fourth**

   - Main feature/fix implementation
   - Business logic

5. **Tests fifth**

   - Unit tests
   - Integration tests
   - Test fixtures

6. **Documentation last**
   - README updates
   - Code comments (if standalone)
   - Changelog entries

### 4. Determine Commit Type

Analyze the changes to determine the appropriate type:

| Type       | When to Use                                               |
| ---------- | --------------------------------------------------------- |
| `feat`     | New feature or capability added                           |
| `fix`      | Bug fix                                                   |
| `docs`     | Documentation only changes                                |
| `style`    | Formatting, whitespace, semicolons (no code logic change) |
| `refactor` | Code restructuring without changing behavior              |
| `perf`     | Performance improvements                                  |
| `test`     | Adding or updating tests                                  |
| `build`    | Build system, dependencies, tooling                       |
| `ci`       | CI/CD configuration changes                               |
| `chore`    | Maintenance tasks, configs, no production code            |

**Decision logic:**

- Adding a new file with new functionality → `feat`
- Modifying existing code to fix a bug → `fix`
- Only changing `.md` files → `docs`
- Only changing test files → `test`
- Adding/updating dependencies in package.json → `build`
- Updating CI workflows → `ci`
- Updating configs without new features → `chore`
- Code changes that don't change behavior → `refactor`

### 5. Determine Scope

Derive scope from the file paths:

1. **Directory-based scope**: Use the most specific common directory

   - `src/client/components/Button.tsx` → `components` or `button`
   - `src/server/api/*.ts` → `api`
   - `src/hooks/*.ts` → `hooks`

2. **Feature-based scope**: If files span directories but relate to one feature

   - Files across `components/`, `hooks/`, `utils/` for auth → `auth`

3. **No scope**: When changes are too broad or at root level
   - Root config files → no scope or `config`
   - Many unrelated files → no scope

**Scope naming conventions:**

- Use lowercase
- Use kebab-case for multi-word scopes: `user-auth`, `api-client`
- Keep it short (1-2 words max)
- Common scopes: `deps`, `config`, `types`, `utils`, `hooks`, `api`, `ui`, `db`

### 6. Write Commit Message

Format: `type(scope): description`

**Rules:**

- Use imperative mood: "add" not "added" or "adds"
- Lowercase first letter after colon
- No period at the end
- Max 72 characters for subject line
- Be specific but concise

**Good examples:**

- `feat(auth): add JWT token refresh mechanism`
- `fix(api): handle null response in user endpoint`
- `build(deps): add husky and lint-staged`
- `chore(config): configure ESLint for TypeScript`
- `refactor(hooks): extract common logic to useAsync`
- `test(utils): add unit tests for date formatting`

**Bad examples:**

- `feat: stuff` (too vague)
- `Fixed the bug` (wrong mood, no type)
- `feat(authentication-system): Add new authentication system with JWT` (too long, wrong case)

### 7. Execute Commits

For each logical group, in dependency order:

```bash
# Stage specific files
git add <files>

# Commit with proper message (use HEREDOC for multi-line)
git commit -m "type(scope): description"
```

### 8. Important Rules

**NEVER include:**

- "Generated with Claude Code" or similar attribution
- "Co-Authored-By: Claude" or any AI attribution
- Emojis in commit messages
- Links to Claude or Anthropic

**ALWAYS:**

- Verify each commit doesn't break the build
- Keep commits atomic (one logical change per commit)
- Use conventional commit format
- Stage only related files together

### Example Workflow

Given these changed files:

```
package.json (added husky, lint-staged)
.eslintrc.cjs (new file)
commitlint.config.cjs (new file)
.husky/pre-commit (new file)
.husky/commit-msg (new file)
.husky/pre-push (new file)
src/utils/helper.ts (bug fix)
```

**Commit plan:**

1. `build(deps): add husky, commitlint, and lint-staged`

   - Stage: `package.json`, `yarn.lock`

2. `chore(config): add ESLint configuration`

   - Stage: `.eslintrc.cjs`

3. `chore(config): add commitlint configuration`

   - Stage: `commitlint.config.cjs`

4. `chore(husky): configure git hooks for code quality`

   - Stage: `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`

5. `fix(utils): resolve null check in helper function`
   - Stage: `src/utils/helper.ts`
