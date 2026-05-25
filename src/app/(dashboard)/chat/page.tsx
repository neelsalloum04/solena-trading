'use client'
import { Button } from '@/components/ui/button'
import { UpgradeOverlay } from '@/components/upgrade/UpgradeOverlay'
import { useTokens } from '@/contexts/TokenContext'
import { cn } from '@/lib/utils'
import {
  ArrowUp,
  Bot,
  ExternalLink,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  timestamp: string
  model?: string
  cached?: boolean
  tokensUsed?: number
}

const STORAGE_KEY = 'solena-chat-v2'

const QUICK_PROMPTS = [
  'À combien est le Bitcoin aujourd\'hui ?',
  'EUR/USD : achat ou vente en ce moment ?',
  'Analyse l\'or pour un swing trade',
  'Le NASDAQ est-il haussier cette semaine ?',
]

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content: `Bonjour ! Je suis ton analyste IA connecté aux marchés en temps réel.\n\nPose une question sur n'importe quel actif, ou envoie un graphique — je t'analyserai l'entrée, le stop loss et le take profit.\n\nQue veux-tu analyser ?`,
  timestamp: new Date().toISOString(),
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-solena-text font-semibold">$1</strong>')
    .replace(/^### (.*?)$/gm, '<h3 class="text-sm font-bold text-solena-text mt-3 mb-1">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-base font-bold text-solena-text mt-4 mb-2">$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1 class="text-lg font-bold text-solena-text mt-4 mb-2">$1</h1>')
    .replace(/^[-•] (.*?)$/gm, '<li class="ml-3 list-disc text-solena-text-secondary">$1</li>')
    .replace(/`(.*?)`/g, '<code class="bg-solena-bg px-1.5 py-0.5 rounded text-xs font-mono text-solena-primary">$1</code>')
    .replace(/\n/g, '<br/>')
}

function ChatContent() {
  const { syncBalance } = useTokens()
  const [messages, setMessages]         = useState<Message[]>([WELCOME])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [missingKey, setMissingKey]     = useState(false)
  const [tokenExhausted, setTokenExhausted] = useState(false)
  const [hydrated, setHydrated]         = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)

  // Load messages from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: Message[] = JSON.parse(saved)
        if (parsed.length > 0) setMessages(parsed)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    if (!hydrated) return
    try {
      const toSave = messages.slice(-30).map(m => ({ ...m, imageUrl: undefined }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch {}
  }, [messages, hydrated])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const startNewConversation = () => {
    setMessages([{ ...WELCOME, id: '0', timestamp: new Date().toISOString() }])
    setInput('')
    setImageFile(null)
    setImagePreview(null)
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() && !imageFile) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      imageUrl: imagePreview || undefined,
      timestamp: new Date().toISOString(),
    }

    const historyForApi = messages.slice(-5).map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setImageFile(null)
    setImagePreview(null)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          imageUrl: imagePreview,
          history: historyForApi,
          plan: 'free',
        }),
      })
      const data = await res.json()

      if (res.status === 503) { setMissingKey(true); setLoading(false); return }

      if (res.status === 402) {
        setTokenExhausted(true)
        setLoading(false)
        return
      }

      if (!res.ok) {
        const hint = data.error?.includes('quota') || data.error?.includes('insufficient')
          ? '\n\n💳 Crédits Anthropic insuffisants — recharge sur console.anthropic.com'
          : data.error?.includes('401') || data.error?.includes('auth')
          ? '\n\n🔑 Clé API invalide — vérifie ANTHROPIC_API_KEY dans .env.local'
          : ''
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**Erreur** : ${data.error}${hint}`,
          timestamp: new Date().toISOString(),
        }])
        setLoading(false)
        return
      }

      if (typeof data.newBalance === 'number') syncBalance(data.newBalance)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
        model: data.model,
        cached: data.cached,
        tokensUsed: data.tokensUsed ?? undefined,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erreur réseau. Vérifie ta connexion.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, imageFile, imagePreview, messages, syncBalance])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const showQuickPrompts = messages.length === 1

  return (
    <div className="flex flex-col h-full relative overflow-hidden">

      {/* Token exhaustion overlay */}
      {tokenExhausted && (
        <UpgradeOverlay
          title="Tokens épuisés"
          subtitle="Vous avez utilisé tous vos tokens. Choisissez un forfait pour continuer à utiliser l'Assistant IA."
        />
      )}

      {/* Content — blurred when tokens exhausted */}
      <div
        className="flex flex-col h-full"
        style={tokenExhausted ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' } : {}}
      >

      {/* Missing key banner */}
      {missingKey && (
        <div className="mx-4 mt-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-amber-400 mb-1.5">Clé Anthropic manquante</p>
              <ol className="text-sm text-solena-text-secondary space-y-1 list-decimal list-inside">
                <li>Va sur <a href="https://console.anthropic.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-solena-primary underline inline-flex items-center gap-1">console.anthropic.com <ExternalLink className="w-3 h-3" /></a></li>
                <li>Crée une clé et colle-la dans <code className="bg-solena-bg px-1 rounded text-xs">.env.local</code> → <code className="bg-solena-bg px-1 rounded text-xs">ANTHROPIC_API_KEY=...</code></li>
                <li>Redémarre : <code className="bg-solena-bg px-1 rounded text-xs">npm run dev</code></li>
              </ol>
            </div>
            <button onClick={() => setMissingKey(false)} className="text-solena-text-muted p-1 hover:text-solena-text"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-solena-border bg-solena-bg-secondary flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-solena-primary to-solena-secondary flex items-center justify-center shadow-solena">
            <Bot className="w-4 h-4 text-solena-bg" />
          </div>
          <div>
            <h1 className="font-semibold text-solena-text text-sm">Analyste IA PrimeX</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-solena-success rounded-full animate-pulse" />
              <span className="text-[10px] text-solena-success font-medium">En ligne · Données temps réel</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-solena-primary/10 to-solena-secondary/10 border border-solena-primary/20 text-solena-primary text-xs font-bold px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3 h-3" /> Claude
          </span>
          <button
            onClick={startNewConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-solena-text-muted hover:text-solena-text hover:bg-solena-card border border-solena-border transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nouvelle conversation</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3 animate-slide-up', msg.role === 'user' && 'flex-row-reverse')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-solena-primary to-solena-secondary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-solena">
                <TrendingUp className="w-4 h-4 text-solena-bg" />
              </div>
            )}
            <div className={cn('max-w-[80%] space-y-1', msg.role === 'user' && 'items-end flex flex-col')}>
              {msg.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-solena-border">
                  <img src={msg.imageUrl} alt="Graphique" className="max-h-60 object-contain" />
                </div>
              )}
              <div className={cn(
                'px-4 py-3.5 rounded-2xl text-sm leading-relaxed',
                msg.role === 'assistant'
                  ? 'bg-solena-card border border-solena-border text-solena-text'
                  : 'bg-solena-primary text-solena-bg font-medium'
              )}>
                {msg.role === 'assistant'
                  ? <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  : <p>{msg.content}</p>
                }
              </div>
              <div className="flex items-center gap-2 px-1">
                <p className="text-[10px] text-solena-text-muted">
                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {msg.cached && (
                  <span className="text-[10px] text-solena-primary bg-solena-primary/10 px-1.5 py-0.5 rounded-md font-medium">⚡ cache</span>
                )}
                {msg.model && !msg.cached && (
                  <span className="text-[10px] text-solena-text-muted opacity-50">
                    {msg.model.includes('haiku') ? '⚡ rapide' : '🧠 avancé'}
                  </span>
                )}
                {msg.tokensUsed && !msg.cached && (
                  <span className="text-[10px] text-solena-text-muted opacity-40 tabular-nums">
                    {msg.tokensUsed.toLocaleString('fr-FR')} tokens
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-solena-primary to-solena-secondary flex items-center justify-center flex-shrink-0 shadow-solena">
              <TrendingUp className="w-4 h-4 text-solena-bg" />
            </div>
            <div className="bg-solena-card border border-solena-border rounded-2xl px-4 py-3.5 flex items-center gap-2 text-sm text-solena-text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-solena-primary" />
              Analyse en cours…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {showQuickPrompts && (
        <div className="px-4 md:px-6 pb-3 flex-shrink-0">
          <div className="flex gap-2 flex-wrap">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="flex items-center gap-1.5 text-xs bg-solena-card border border-solena-border text-solena-text-secondary hover:text-solena-text hover:border-solena-border-light px-3 py-2 rounded-xl transition-all"
              >
                <Zap className="w-3 h-3 text-solena-primary flex-shrink-0" />
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 md:px-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-solena-card border border-solena-border rounded-xl p-2 w-fit">
            <img src={imagePreview} alt="Aperçu" className="h-12 w-16 object-cover rounded-lg" />
            <div>
              <p className="text-xs font-medium text-solena-text">{imageFile?.name}</p>
              <p className="text-[10px] text-solena-text-muted">Prêt à analyser</p>
            </div>
            <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="p-1 hover:bg-solena-bg rounded-lg ml-1 transition-colors">
              <X className="w-3.5 h-3.5 text-solena-text-muted" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-solena-border flex-shrink-0">
        <div className="flex items-end gap-2 bg-solena-card border border-solena-border rounded-2xl p-3 focus-within:border-solena-primary/30 transition-colors">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-solena-text-muted hover:text-solena-primary hover:bg-solena-bg rounded-xl transition-all flex-shrink-0"
            title="Envoyer un graphique"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question… (Entrée pour envoyer)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-solena-text placeholder-solena-text-muted resize-none focus:outline-none min-h-[20px] max-h-28"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = t.scrollHeight + 'px'
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={(!input.trim() && !imageFile) || loading}
            loading={loading}
            size="icon"
            className="w-9 h-9 rounded-xl flex-shrink-0"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-solena-text-muted mt-2">
          Contenu éducatif uniquement · Pas un conseil en investissement · Le trading comporte un risque de perte en capital
        </p>
      </div>

      </div>{/* end blurred content wrapper */}
    </div>
  )
}

export default function ChatPage() {
  return <ChatContent />
}
