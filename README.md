# claude-mods

Claude Code mods by David Parys.

## rule-keeper

When you correct Claude ("no…", "this doesn't look good", "I wish we'd…", "don't use…", "why did you…"), a band appears above the prompt once Claude has finished replying:

**Save as a rule?** `[Project CLAUDE.md]` `[My CLAUDE.md]` `[A skill]` `[Not now]`

Click a save button and Claude turns your correction into one short, general rule and writes it into that file. Before adding the rule, Claude reads the file and tightens a matching rule if there is one, so you don't get duplicates. Then it tells you which rule it wrote and where.

- **Project CLAUDE.md**: `CLAUDE.md` in the current project (created if missing)
- **My CLAUDE.md**: `~/.claude/CLAUDE.md`, which applies to every project
- **A skill**: the `SKILL.md` of the skill the correction is about (Claude asks if none clearly fits)

Only prompts you type trigger it. It ignores slash commands, messages over 1,000 characters and the first message of a session. The trigger phrases are in [`rule-keeper/hooks/detect.ts`](rule-keeper/hooks/detect.ts).

### Install

In a terminal, start `claude` and type:

```
/plugin install rule-keeper --marketplace davidparys/claude-mods
```

Answer `y` to add the marketplace, then press Enter to install for your user. It loads in every new session from then on, the Claude desktop app's Code tab included. The desktop app can't run `/plugin`, so install it from a terminal once.

Alternatively, add this to `~/.claude/settings.json` and start a new session:

```json
{
  "extraKnownMarketplaces": {
    "claude-mods": { "source": { "source": "github", "repo": "davidparys/claude-mods" } }
  },
  "enabledPlugins": {
    "rule-keeper@claude-mods": true
  }
}
```

### Develop

```bash
claude plugin validate .
```

```bash
claude plugin test rule-keeper
```
