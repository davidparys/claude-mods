// Phrases that usually mean the person is correcting Claude's last answer.
const CORRECTIONS: readonly RegExp[] = [
  /^(no|nope|nah)\b/,
  /\b(that'?s|this is|it'?s) (not|wrong|incorrect)\b/,
  /\b(doesn'?t|does not|didn'?t|did not) (look|work|feel|seem|sound)\b/,
  /\bnot what i (asked|wanted|meant|said)\b/,
  /\bi wish\b/,
  /\bi(?:'d| would) (?:prefer|rather|have liked)\b/,
  /\b(stop|don'?t|do not|never) (do|doing|use|using|add|adding|write|writing|change|changing)\b/,
  /\b(you|we) should(?:n'?t| not)? have\b/,
  /\bwhy (did|would) you\b/,
  /\b(i told you|like i said|as i said)\b/,
  /\b(wrong|incorrect)\b/,
]

const MAX_LENGTH = 1000

export function isCorrection(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[’‘]/g, "'")
  if (t === '' || t.startsWith('/') || t.length > MAX_LENGTH) {
    return false
  }
  return CORRECTIONS.some(pattern => pattern.test(t))
}
