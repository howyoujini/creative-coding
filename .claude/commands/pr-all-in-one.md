# Create Pull Request

Create a pull request from the current branch to the main branch.

## Usage

```
/pr-all-in-one
```

## Instructions

1. Check the current git status and branch:
   - Run `git status` to see uncommitted changes
   - Run `git branch --show-current` to get the current branch name

2. If current branch is `main`:
   - If there are uncommitted changes:
     a. Analyze the changes to generate a branch name based on the type of changes
     b. Branch name format: `<type>/<description>` (e.g., `feat/add-pr-command`, `fix/login-bug`)
     c. Create the new branch automatically: `git checkout -b <branch-name>`
     d. Proceed to step 3
   - If no uncommitted changes, inform user and exit

3. If there are uncommitted changes (staged, unstaged, or untracked files):
   - Automatically commit them (no confirmation needed)
   - Analyze all changes using `git diff` and `git diff --cached`
   - **IMPORTANT: Always separate commits by concern (Separation of Concerns)**
     - Each commit should have a single, clear purpose
     - Never mix unrelated changes in a single commit
     - Separate by concern type:
       - **Feature**: New functionality or feature additions
       - **Fix**: Bug fixes
       - **Refactor**: Code restructuring without behavior change
       - **Style**: Formatting, whitespace, styling changes
       - **Docs**: Documentation updates
       - **Test**: Adding or updating tests
       - **Chore**: Build, config, dependency updates
     - Example: If you have a bug fix and a new feature, create 2 separate commits
   - For each logical group:
     a. Stage only the related files: `git add <files>`
     b. Create a commit with a descriptive message following conventional commits format
     c. Commit message should be in English (e.g., `feat: add new feature`, `fix: resolve bug`, `chore: update config`)
     d. **DO NOT add Claude signature or Co-Authored-By to commit messages**
   - Show the user the commits that were created before proceeding

4. Push the current branch to remote if not already pushed:
   - Run `git push -u origin <current-branch>` if needed

5. Check if a PR already exists for this branch:
   - Run `gh pr view --json url,title,body 2>/dev/null` to check for existing PR
   - If PR exists: proceed to step 6 (update existing PR)
   - If no PR exists: proceed to step 7 (create new PR)

6. Update existing PR (if PR already exists):
   - Analyze all commits on this branch compared to main using `git log main..HEAD`
   - Generate a meaningful PR title and description based on ALL commits (including new ones)
   - Follow the PR template at `.github/pull_request_template.md`
   - **Write all descriptions in both Korean and English (bilingual)**
   - **DO NOT add Claude signature to PR body**
   - **ALWAYS update PR title and body to reflect all commits**, even if just pushing new commits
   - Use `gh pr edit --title "<title>" --body "<description>"` to update the PR
   - Return the existing PR URL to the user

7. Create new PR (if no PR exists):
   - Analyze all commits on this branch compared to main using `git log main..HEAD`
   - Generate a meaningful PR title and description based on the commits
   - Follow the PR template at `.github/pull_request_template.md`
   - **Write all descriptions in both Korean and English (bilingual)**
   - **DO NOT add Claude signature to PR body**
   - Use `gh pr create --draft --base main --title "<title>" --body "<description>"`

8. Return the PR URL to the user.

## PR Description Format

Follow the project's PR template (`.github/pull_request_template.md`).
**IMPORTANT: Write all content in both Korean and English.**

```markdown
## Context

**Description Details:**

<English description of the changes based on commit analysis>
<The problem this feature solves or the value it provides>

---

<한국어로 커밋 분석 기반 변경사항 설명>
<이 기능이 해결하는 문제 또는 제공하는 가치>

## Screenshots or Videos
```

## Commit Separation Guidelines

**Always separate commits by concern.** Each commit should represent a single logical change.

| Concern Type | Prefix | Example |
|--------------|--------|---------|
| New feature | `feat:` | `feat: add user profile page` |
| Bug fix | `fix:` | `fix: resolve login redirect issue` |
| Refactoring | `refactor:` | `refactor: extract validation logic` |
| Styling | `style:` | `style: format code with prettier` |
| Documentation | `docs:` | `docs: update API documentation` |
| Tests | `test:` | `test: add unit tests for auth` |
| Build/Config | `chore:` | `chore: update dependencies` |

**Bad Example:**
```
git add .
git commit -m "fix bug and add new feature and update docs"
```

**Good Example:**
```
git add src/auth.ts
git commit -m "fix: resolve token expiration bug"

git add src/profile.ts
git commit -m "feat: add user profile component"

git add README.md
git commit -m "docs: update installation guide"
```
