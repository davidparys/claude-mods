import { expect, test } from 'claude-code/testing'
import type { On, PromptSubmitInput } from 'claude-code'

import { isCorrection } from './detect'

const BAND = {
  plugin: 'rule-keeper',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const SURFACES = ['terminal', 'desktop'] as const

const typed = (text: string): PromptSubmitInput => ({
  text,
  wait: false,
  origin: { kind: 'composer' },
})

// Stand in for the engine beneath the plugin; returns the prompts that reached it.
function engine(on: On): string[] {
  const sent: string[] = []
  on('prompt.submit', ($, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })
  return sent
}

const turnEnded = {
  answer: 'Done.',
  durationMs: 1000,
  isAborted: false,
  turnId: 't1',
  reason: 'answer',
} as const

test('spots corrections and ignores ordinary requests', () => {
  for (const text of [
    'no, use tabs',
    "This doesn't look good",
    "I wish we'd done it with a hook instead",
    'that’s wrong',
    "don't use semicolons",
    'why did you delete the test?',
  ]) {
    expect(isCorrection(text)).toBe(true)
  }
  for (const text of [
    'add a dark mode toggle',
    'nothing else for now, thanks',
    'notice the header spacing and fix it',
    '/review',
  ]) {
    expect(isCorrection(text)).toBe(false)
  }
})

test('no band for a correction before Claude has replied', async ($, on) => {
  engine(on)
  await $.prompt.submit(typed('no, not like that'))

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ key: 'project' })).toBeUndefined()
    await ui.unmount()
  }
})

test('a correction offers to save a rule, and Save asks Claude to write it', async ($, on) => {
  const sent = engine(on)

  for (const surface of SURFACES) {
    await $.turn.complete(turnEnded)
    await $.prompt.submit(typed("No, this doesn't look good. Use the brand colours."))

    const working = await $.ui.mount({ ...BAND, surface, props: { ...BAND.props, isWorking: true } })
    expect(await working.find({ key: 'project' })).toBeUndefined()
    await working.unmount()

    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /brand colours/ })).toBeDefined()

    await ui.press({ key: 'project' })
    const prompt = sent[sent.length - 1] ?? ''
    expect(prompt).toContain('CLAUDE.md')
    expect(prompt).toContain('> No, this doesn\'t look good. Use the brand colours.')
    await ui.unmount()

    const after = await $.ui.mount({ ...BAND, surface })
    expect(await after.find({ key: 'project' })).toBeUndefined()
    await after.unmount()
  }
})

test('the next ordinary prompt takes the offer down', async ($, on) => {
  engine(on)

  await $.turn.complete(turnEnded)
  await $.prompt.submit(typed('nope, wrong file'))
  await $.prompt.submit(typed('ok now add a footer'))

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ key: 'project' })).toBeUndefined()
  await ui.unmount()
})
