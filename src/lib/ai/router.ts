// Intelligent model routing — cheapest model that can handle the task

export type ModelTier = 'fast' | 'smart'

const MODEL_MAP: Record<ModelTier, string> = {
  fast: 'claude-haiku-4-5-20251001',   // ~20x cheaper than Sonnet, ideal for simple queries
  smart: 'claude-sonnet-4-6',          // Full power for complex analysis
}

const MAX_TOKENS_MAP: Record<ModelTier, number> = {
  fast: 300,   // Short answers only
  smart: 700,  // Detailed analysis but still capped
}

// Simple question patterns → Haiku
const SIMPLE_PATTERNS = [
  /^(à combien|prix|cours|valeur|combien vaut|combien coûte)/i,
  /^(qu'?est.?ce que|c'?est quoi|définition|que veut dire|expliqu)/i,
  /^(bitcoin|btc|eth|bnb|sol|xrp).{0,30}(aujourd|maintenant|prix|cours)/i,
  /^(eur|gbp|jpy|chf|aud).{0,30}(aujourd|maintenant|taux)/i,
  /^(bonjour|salut|merci|ok|super)/i,
]

// Complex patterns → Sonnet
const COMPLEX_PATTERNS = [
  /analys/i,
  /setup|stratégi|position/i,
  /swing|scalp|day.?trad/i,
  /graphique|chart|h[14]|m[1345]|weekly|daily/i,
  /indicateur|rsi|macd|bollinger|fibonacci|ema|sma/i,
  /\b(sl|tp|stop|profit)\b.*\b(zone|niveau|entry)/i,
]

export function routeMessage(message: string, hasImage: boolean): ModelTier {
  if (hasImage) return 'smart'  // Vision requires Sonnet

  const lower = message.trim()

  if (SIMPLE_PATTERNS.some(p => p.test(lower))) return 'fast'
  if (COMPLEX_PATTERNS.some(p => p.test(lower))) return 'smart'

  // Length heuristic: short messages are usually simple questions
  if (message.length < 60) return 'fast'
  if (message.length > 150) return 'smart'

  return 'fast' // Default to cheap model
}

export function getModel(tier: ModelTier): string { return MODEL_MAP[tier] }
export function getMaxTokens(tier: ModelTier): number { return MAX_TOKENS_MAP[tier] }
