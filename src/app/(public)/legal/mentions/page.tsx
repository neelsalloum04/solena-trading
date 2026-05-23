import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Légales — PrimeX',
}

export default function MentionsPage() {
  return (
    <article>
      <h1 className="text-2xl font-black text-white mb-10">Mentions Légales</h1>

      <Section title="Éditeur de la plateforme">
        <Row label="Dénomination sociale" value="ECOMSTART GROUP LLC" />
        <Row label="Forme juridique"      value="Limited Liability Company (LLC)" />
        <Row label="Numéro EIN"           value="32-0847435" />
        <Row label="Siège social"         value="30 N Gould St, Ste R, Sheridan, Wyoming 82801, États-Unis" />
        <Row label="Directeur"            value="NEEL SALLOUM" />
        <Row label="Email"                value="contact@ecomstartprofits.com" />
        <Row label="Site web"             value="https://solena-trading.vercel.app" />
      </Section>

      <Section title="Hébergement">
        <Row label="Hébergeur" value="Vercel Inc." />
        <Row label="Adresse"   value="340 Pine Street, Suite 701, San Francisco, CA 94104, USA" />
        <Row label="Site web"  value="https://vercel.com" />
        <p className="text-[13px] text-[#666] mt-2">Base de données hébergée par Supabase (serveurs localisés en Europe — Frankfurt, Allemagne).</p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>L'ensemble du contenu de la Plateforme PrimeX (textes, graphiques, logos, algorithmes, interfaces) est la propriété exclusive de ECOMSTART GROUP LLC et est protégé par les lois américaines et internationales relatives à la propriété intellectuelle.</p>
        <p>Toute reproduction, représentation, modification, publication ou adaptation, totale ou partielle, des éléments de la Plateforme, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de ECOMSTART GROUP LLC.</p>
      </Section>

      <Section title="Avertissement financier">
        <div className="bg-[#1a0a0a] border border-[#ef4444]/20 rounded-xl p-4">
          <p className="text-[13px] text-[#888] leading-relaxed font-medium">
            Les informations fournies sur cette plateforme sont destinées exclusivement à des fins éducatives et informatives. Elles ne constituent en aucun cas un conseil en investissement, une recommandation financière ou une incitation à acheter ou vendre un actif financier. Le trading comporte des risques importants de perte en capital. Chaque utilisateur reste entièrement responsable de ses décisions financières et de ses investissements.
          </p>
        </div>
        <p className="text-[13px] text-[#666] mt-3">
          PrimeX est un outil d'aide à la décision à vocation éducative. ECOMSTART GROUP LLC n'est pas un conseiller en investissement agréé et ne fournit aucun conseil financier réglementé.
        </p>
      </Section>

      <Section title="Limitation de responsabilité">
        <p>ECOMSTART GROUP LLC ne saurait être tenu responsable des dommages directs ou indirects causés à l'utilisateur lors de l'accès à la Plateforme ou de l'utilisation des informations qui y sont diffusées.</p>
        <p>PrimeX ne garantit pas l'exactitude, la complétude ou l'actualité des informations diffusées. L'utilisateur est seul responsable de l'utilisation qu'il fait de ces informations et des décisions de trading qu'il prend.</p>
      </Section>

      <Section title="Protection des données personnelles">
        <p>Vos données personnelles sont collectées et traitées conformément à notre <a href="/legal/privacy" className="text-[#D4AF37] hover:underline">Politique de Confidentialité</a>.</p>
        <p>Pour toute demande relative à vos données (accès, rectification, suppression), contactez-nous à : <span className="text-[#D4AF37]">contact@ecomstartprofits.com</span></p>
      </Section>

      <Section title="Contact">
        <Row label="Email"   value="contact@ecomstartprofits.com" />
        <Row label="Société" value="ECOMSTART GROUP LLC" />
        <Row label="Adresse" value="30 N Gould St, Ste R, Sheridan, Wyoming 82801, USA" />
      </Section>

      <Section title="Droit applicable">
        <p>La Plateforme est éditée par une société de droit américain (Wyoming LLC). Les présentes mentions légales sont soumises au droit de l'État du Wyoming, États-Unis.</p>
        <p>En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours juridictionnel. Pour tout différend, contactez-nous à <span className="text-[#D4AF37]">contact@ecomstartprofits.com</span>.</p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-white mb-3 pb-2 border-b border-[#1a1a1a]">{title}</h2>
      <div className="space-y-3 text-[13px] text-[#888] leading-relaxed">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-[#555] w-40 flex-shrink-0">{label} :</span>
      <span className="text-[#ccc]">{value}</span>
    </div>
  )
}
