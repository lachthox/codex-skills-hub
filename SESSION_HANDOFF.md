# Session Handoff (2026-02-19)

## Repository
- Local path: `C:\Users\lachlanyoga\codex-skills-hub`
- GitHub: `https://github.com/lachthox/codex-skills-hub`
- Visibility: **Public**

## Current Skill Taxonomy
- `BestPractices/`
- `LanguageSpecific/`
- `PlatformSpecific/Linux/`
- `PlatformSpecific/Windows/`
- `PlatformSpecific/macOS/`
- `DesignUX/`
- `Tooling/`
- `WorkflowAutomation/`
- `Reference/`
- `SkillsLobby/` (intake)

## Automation Implemented
- Router script: `.github/scripts/route_skills.py`
- Workflow: `.github/workflows/skill-router.yml`

### Behavior
- Upload new skills to `SkillsLobby/<SkillName>/SKILL.md`.
- On `push` to `main`: workflow auto-moves skills to best category and commits result.
- On `pull_request`: workflow runs dry-run and posts/updates a PR comment report.
- Report also appears in Actions run summary.
- Report is temporary in runner; not committed to repo.

### Routing Logic
1. Explicit `Category: <value>` in `SKILL.md`.
2. Keyword score from folder name + `SKILL.md` content.
3. Fallback to `Reference/Unsorted`.

## Commits from this session
- `2cf2113` Initial skills taxonomy
- `cf7d039` Add GitHub Actions skill routing system
- `1eaaaa1` Use SkillsLobby intake and add PR routing report

## Notes
- Public repo with standard GitHub-hosted runners should not incur normal Actions-minute charges for this workflow.
- Optional next enhancement discussed: strict mode to fail workflow when route would be `Reference/Unsorted`.
