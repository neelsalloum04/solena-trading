import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Légales — PrimeX',
}

export default function MentionsPage() {
  return (
    <article>
      <h1 className="text-2xl font-black text-white mb-10">Mentions Légales</h1>

      <Section title="Éditeur de la plateforme">
        <Row label="Dénomination sociale" value="PrimeX SAS" />
        <Row label="Forme juridique" value="Société par Actions Simplifiée (SAS)" />
        <Row label="Capital social" value="10 000 €" />
        <Row label="Siège social" value="Paris, France" />
        <Row label="Email" value="contact@primex.ai" />
        <Row label="Site web" value="https://primex.ai" />
      </Section>

      <Section title="Hébergement">
        <Row label="Hébergeur" value="Vercel Inc." />
        <Row label="Adresse" value="340 Pine Street, Suite 701, San Francisco, CA 94104, USA" />
        <Row label="Site web" value="https://vercel.com" />
        <p className="text-[13px] text-[#666] mt-2">Base de données hébergée par Supabase (serveurs localisés en Europe — Frankfurt, Allemagne).</p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>L'ensemble du contenu de la Plateforme PrimeX (textes, graphiques, logos, algorithmes, signaux IA, interfaces) est la propriété exclusive de PrimeX SAS et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.</p>
        <p>Toute reproduction, représentation, modification, publication ou adaptation, totale ou partielle, des éléments de la Plateforme, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de PrimeX SAS.</p>
      </Section>

      <Section title="Avertissement financier">
        <div className="bg-[#1a0a0a] border border-[#ef4444]/20 rounded-xl p-4">
          <p className="text-[13px] text-[#888] leading-relaxed font-medium">
            Les informations fournies sur cette plateforme sont destinées exclusivement à des fins éducatives et informatives. Elles ne constituent en aucun cas un conseil en investissement, une recommandation financière ou une incitation à acheter ou vendre un actif. Le trading comporte des risques importants de perte en capital. Chaque utilisateur reste entièrement responsable de ses décisions financières et de ses investissements.
          </p>
        </div>
        <p className="text-[13px] text-[#666] mt-3">PrimeX n'est pas un conseiller en investissement agréé et n'est pas enregistré auprès de l'AMF (Autorité des marchés financiers) en tant que tel.</p>
      </Section>

      <Section title="Limitation de responsabilité">
        <p>PrimeX SAS ne saurait être tenu responsable des dommages directs ou indirects causés à l'utilisateur, lors de l'accès à la Plateforme ou de l'utilisation des informations qui y sont diffusées.</p>
        <p>PrimeX ne peut garantir l'exactitude, la complétude ou l'actualité des informations diffusées. L'utilisateur est seul responsable de l'utilisation qu'il fait de ces informations.</p>
      </Section>

      <Section title="Protection des données personnelles">
        <p>Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.</p>
        <p>Pour en savoir plus, consultez notre <a href="/legal/privacy" className="text-[#D4AF37] hover:underline">Politique de Confidentialité</a>.</p>
        <p>Contact DPO : <span className="text-[#D4AF37]">privacy@primex.ai</span></p>
      </Section>

      <Section title="Médiation">
        <p>En cas de litige relatif à un abonnement ou à une prestation, vous pouvez recourir gratuitement au service de médiation de la consommation compétent après avoir tenté de résoudre le litige directement avec notre service client.</p>
        <p>Contact service client : <span className="text-[#D4AF37]">support@primex.ai</span></p>
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
