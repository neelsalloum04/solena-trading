// HTML email templates — inline CSS for max compatibility

const BASE = `
  <div style="background:#080808;min-height:100vh;padding:40px 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto">
`
const FOOT = `
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1a1a1a;text-align:center">
        <p style="color:#444;font-size:11px;line-height:1.6;margin:0">
          PrimeX IA · Trading Institutionnel Propulsé par l'IA<br/>
          <a href="https://primex-trading.vercel.app/legal/mentions" style="color:#555;text-decoration:none">Mentions légales</a>
          &nbsp;·&nbsp;
          <a href="https://primex-trading.vercel.app/legal/privacy" style="color:#555;text-decoration:none">Confidentialité</a>
          &nbsp;·&nbsp;
          <a href="https://primex-trading.vercel.app/legal/cgv" style="color:#555;text-decoration:none">CGV</a>
        </p>
      </div>
    </div>
  </div>
`

function logo() {
  return `
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:22px;font-weight:900;color:#D4AF37;letter-spacing:-0.5px">PrimeX IA</span>
    </div>
  `
}

function card(content: string) {
  return `
    <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;padding:32px">
      ${content}
    </div>
  `
}

function btn(label: string, url: string) {
  return `
    <div style="text-align:center;margin-top:28px">
      <a href="${url}" style="display:inline-block;background:#D4AF37;color:#080808;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:12px">
        ${label}
      </a>
    </div>
  `
}

// ── Welcome email ─────────────────────────────────────────────────────────────

export function welcomeEmail(name: string) {
  const html = BASE + logo() + card(`
    <h1 style="color:#F2EDD7;font-size:20px;font-weight:800;margin:0 0 8px">
      Bienvenue sur PrimeX IA 👋
    </h1>
    <p style="color:#555;font-size:13px;margin:0 0 24px">
      Ton compte est prêt, ${name || 'trader'}.
    </p>

    <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 20px">
      Tu as maintenant accès à la plateforme de trading IA institutionnel. Voici ce que tu peux faire dès maintenant :
    </p>

    <div style="margin:0 0 24px">
      ${['📊 Analyse Graphique IA — Upload ton graphique, reçois BUY/SELL/WAIT en secondes',
         '💬 Chat IA — Pose tes questions sur n\'importe quel marché 24h/24',
         '⚡ Signaux Live — Alertes BTC, ETH, EUR/USD en temps réel',
         '🤖 Trading Bot — Exécution automatique avec gestion du risque'].map(f => `
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
          <span style="color:#888;font-size:13px;line-height:1.6">${f}</span>
        </div>
      `).join('')}
    </div>

    ${btn('Accéder à la plateforme', 'https://primex-trading.vercel.app/dashboard')}

    <p style="color:#444;font-size:12px;text-align:center;margin:20px 0 0">
      Des questions ? Réponds à cet email ou contacte-nous sur
      <a href="mailto:support@primex-trading.com" style="color:#D4AF37;text-decoration:none">support@primex-trading.com</a>
    </p>
  `) + FOOT

  return { subject: 'Bienvenue sur PrimeX IA 🎯', html }
}

// ── Subscription confirmed ────────────────────────────────────────────────────

export function subscriptionEmail(name: string, plan: string, amount: string) {
  const planLabel = plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : 'Prime'

  const html = BASE + logo() + card(`
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:12px 20px">
        <span style="color:#22c55e;font-weight:800;font-size:15px">✓ Abonnement activé</span>
      </div>
    </div>

    <h1 style="color:#F2EDD7;font-size:18px;font-weight:800;margin:0 0 8px;text-align:center">
      Plan ${planLabel} activé
    </h1>
    <p style="color:#555;font-size:13px;margin:0 0 28px;text-align:center">
      Merci ${name || ''} — ton paiement de <strong style="color:#F2EDD7">${amount}</strong> a été traité.
    </p>

    <div style="background:#0f0f0f;border:1px solid #1a1a1a;border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Récapitulatif</p>
      ${[
        ['Plan', planLabel],
        ['Montant', amount],
        ['Renouvellement', 'Automatique chaque mois'],
        ['Annulation', 'À tout moment depuis les Paramètres'],
      ].map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1a1a">
          <span style="color:#555;font-size:13px">${k}</span>
          <span style="color:#F2EDD7;font-size:13px;font-weight:600">${v}</span>
        </div>
      `).join('')}
    </div>

    ${btn('Accéder à ma plateforme', 'https://primex-trading.vercel.app/dashboard')}

    <p style="color:#444;font-size:12px;text-align:center;margin:20px 0 0">
      Pour gérer ton abonnement : <a href="https://primex-trading.vercel.app/settings" style="color:#D4AF37;text-decoration:none">Paramètres → Abonnement</a>
    </p>
  `) + FOOT

  return { subject: `✓ Abonnement PrimeX ${planLabel} activé`, html }
}

// ── Price alert triggered ─────────────────────────────────────────────────────

export function priceAlertEmail(
  name: string,
  coinSymbol: string,
  targetPrice: string,
  direction: 'above' | 'below',
  currentPrice: string
) {
  const icon = direction === 'above' ? '📈' : '📉'
  const dirLabel = direction === 'above' ? 'au-dessus de' : 'en-dessous de'
  const accentColor = direction === 'above' ? '#22c55e' : '#ef4444'

  const html = BASE + logo() + card(`
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:12px 24px">
        <span style="color:#D4AF37;font-weight:800;font-size:22px">${icon} ${coinSymbol}</span>
      </div>
    </div>

    <h1 style="color:#F2EDD7;font-size:18px;font-weight:800;margin:0 0 8px;text-align:center">
      Alerte de prix déclenchée !
    </h1>
    <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 24px;text-align:center">
      Bonjour ${name},<br/>
      <strong style="color:#F2EDD7">${coinSymbol}</strong> est maintenant ${dirLabel} <strong style="color:#D4AF37">${targetPrice}</strong>.
    </p>

    <div style="background:#0f0f0f;border:1px solid #1a1a1a;border-radius:12px;padding:16px;margin-bottom:24px">
      ${[
        ['Actif', coinSymbol],
        ['Condition', `Prix ${dirLabel} ${targetPrice}`],
        ['Prix actuel', `<span style="color:${accentColor};font-weight:700">${currentPrice}</span>`],
      ].map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1a1a1a">
          <span style="color:#555;font-size:13px">${k}</span>
          <span style="color:#F2EDD7;font-size:13px;font-weight:600">${v}</span>
        </div>
      `).join('')}
    </div>

    ${btn('Voir les marchés →', 'https://primex-trading.vercel.app/dashboard')}

    <p style="color:#444;font-size:12px;text-align:center;margin:20px 0 0">
      Gérer tes alertes : <a href="https://primex-trading.vercel.app/portfolio" style="color:#D4AF37;text-decoration:none">Portfolio → Alertes de prix</a>
    </p>
  `) + FOOT

  return { subject: `${icon} Alerte ${coinSymbol} déclenchée — PrimeX IA`, html }
}

// ── Subscription cancelled ────────────────────────────────────────────────────

export function cancellationEmail(name: string, plan: string, endsAt: string) {
  const planLabel = plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : 'Prime'

  const html = BASE + logo() + card(`
    <h1 style="color:#F2EDD7;font-size:18px;font-weight:800;margin:0 0 8px">
      Annulation confirmée
    </h1>
    <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 20px">
      Bonjour ${name || ''},<br/>
      ton abonnement <strong style="color:#F2EDD7">${planLabel}</strong> a bien été annulé.
      Tu conserves l'accès jusqu'au <strong style="color:#D4AF37">${endsAt}</strong>.
    </p>

    <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 24px">
      Après cette date, ton compte passera en plan Gratuit. Tes données et l'historique sont conservés.
    </p>

    ${btn('Réactiver mon abonnement', 'https://primex-trading.vercel.app/settings')}

    <p style="color:#444;font-size:12px;text-align:center;margin:20px 0 0">
      Tu nous manques déjà. Pour toute question : <a href="mailto:support@primex-trading.com" style="color:#D4AF37;text-decoration:none">support@primex-trading.com</a>
    </p>
  `) + FOOT

  return { subject: 'Annulation de ton abonnement PrimeX IA', html }
}
