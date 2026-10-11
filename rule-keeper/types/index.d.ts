export type Offer = { feedback: string }

declare module 'claude-code' {
  interface PluginState {
    'rule-keeper': { offer: Offer | null; hasReplied: boolean }
  }
}
