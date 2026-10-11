import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Offer } from '../types'
import { isCorrection } from './detect'

const offer = atom({ plugin: 'rule-keeper', key: 'offer' } as const, null)
const hasReplied = atom({ plugin: 'rule-keeper', key: 'hasReplied' } as const, false)

// Prompts the person wrote, as opposed to a plugin's, a scheduled task's or a peer's.
const PERSON = new Set(['composer', 'bridge', 'sdk'])

const PREVIEW_LENGTH = 90

type Target = 'project' | 'user' | 'skill'

const DESTINATIONS: Record<Target, string> = {
  project:
    "the project's CLAUDE.md in the current working directory (create it if it does not exist)",
  user: '~/.claude/CLAUDE.md, my personal instructions that apply to every project',
  skill:
    'the SKILL.md of the skill this feedback is most about (look in .claude/skills/ and ~/.claude/skills/). If no skill clearly fits, ask me which one instead of guessing',
}

function savePrompt(feedback: string, target: Target): string {
  const quoted = feedback.trim().replace(/^/gm, '> ')
  return [
    'Save my earlier correction as a permanent rule so you get it right next time. What I said was:',
    '',
    quoted,
    '',
    `Distil it into one short, general, imperative rule (about the pattern, not this one incident) and add it to ${DESTINATIONS[target]}.`,
    'Read the file first: if a rule already covers this, tighten that rule instead of adding a duplicate. Put it under a fitting heading, or under "## Rules from feedback" if none fits.',
    'Then reply in one or two lines with the rule you wrote and the file you wrote it to.',
  ].join('\n')
}

function preview(text: string): string {
  const line = text.trim().replace(/\s+/g, ' ')
  return line.length > PREVIEW_LENGTH ? `${line.slice(0, PREVIEW_LENGTH - 1)}…` : line
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    if (PERSON.has(e.origin.kind)) {
      const isFeedback = (await read($, hasReplied)) && isCorrection(e.text)
      const nextOffer: Offer | null = isFeedback ? { feedback: e.text } : null
      await update($, offer, () => nextOffer)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await update($, hasReplied, () => true)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, offer)
    if (current === null || e.props.hasSurvey || e.props.isWorking) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const save = (target: Target) => async () => {
      await update($, offer, () => null)
      await $.prompt.submit({ text: savePrompt(current.feedback, target), asUser: true })
    }

    return (
      <Box flexDirection="column">
        <Text>
          <Text bold>Save as a rule?</Text>{' '}
          <Text dimColor>“{preview(current.feedback)}”</Text>
        </Text>
        <Box>
          <Button
            key="project"
            label="Project CLAUDE.md"
            variant="primary"
            onPress={save('project')}
          />
          <Text> </Text>
          <Button key="user" label="My CLAUDE.md" onPress={save('user')} />
          <Text> </Text>
          <Button key="skill" label="A skill" onPress={save('skill')} />
          <Text> </Text>
          <Button
            key="dismiss"
            label="Not now"
            role="dismiss"
            onPress={() => update($, offer, () => null)}
          />
        </Box>
      </Box>
    )
  })
}
