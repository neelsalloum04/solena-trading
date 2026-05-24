import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — PrimeX',
}

const LAST_UPDATE = '23 mai 2026'

export default function CGVPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="text-2xl font-black text-white mb-2">Conditions Générales de Vente</h1>
      <p className="text-[#555] text-xs mb-10">Dernière mise à jour : {LAST_UPDATE}</p>

      <Section title="1. Objet">
        <p>Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre PrimeX SAS (ci-après « PrimeX ») et toute personne physique ou morale (ci-après « le Client ») souhaitant souscrire à un abonnement payant sur la plateforme PrimeX accessible à l'adresse <strong className="text-[#F2EDD7]">primex-trading.vercel.app</strong>.</p>
        <p>Toute souscription à un abonnement implique l'acceptation sans réserve des présentes CGV ainsi que des Conditions Générales d'Utilisation.</p>
      </Section>

      <Section title="2. Offres et tarifs">
        <p>PrimeX propose les abonnements suivants, facturés mensuellement :</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse mt-3">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="text-left py-2 pr-4 text-[#F2EDD7] font-semibold">Forfait</th>
                <th className="text-left py-2 pr-4 text-[#F2EDD7] font-semibold">Prix TTC</th>
                <th className="text-left py-2 text-[#F2EDD7] font-semibold">Fonctionnalités</th>
              </tr>
            </thead>
            <tbody className="text-[#888]">
              <tr className="border-b border-[#111]">
                <td className="py-2 pr-4 text-[#38bdf8] font-medium">Starter</td>
                <td className="py-2 pr-4">49 €/mois</td>
                <td className="py-2">Analyse IA (3/jour), Chat IA (30 msg/jour)</td>
              </tr>
              <tr className="border-b border-[#111]">
                <td className="py-2 pr-4 text-[#D4AF37] font-medium">Pro</td>
                <td className="py-2 pr-4">149 €/mois</td>
                <td className="py-2">Analyse & Chat illimités, Signaux live, Portfolio</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-[#22c55e] font-medium">Premium</td>
                <td className="py-2 pr-4">399 €/mois</td>
                <td className="py-2">Tout inclus + Bot de trading automatisé, accès API</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">Les prix sont indiqués en euros toutes taxes comprises (TTC). PrimeX se réserve le droit de modifier ses tarifs à tout moment, sous réserve d'en informer les Clients 30 jours à l'avance par email.</p>
      </Section>

      <Section title="3. Commande et souscription">
        <p>La souscription à un abonnement s'effectue exclusivement en ligne via la plateforme PrimeX. Le Client sélectionne le forfait souhaité, renseigne ses informations de paiement et valide la commande.</p>
        <p>La confirmation de la commande est envoyée par email à l'adresse fournie lors de l'inscription. L'abonnement prend effet immédiatement après confirmation du paiement.</p>
        <p>Toute souscription est nominative et ne peut être cédée ou transférée à un tiers.</p>
      </Section>

      <Section title="4. Paiement">
        <p>Les paiements sont traités de manière sécurisée par <strong className="text-[#F2EDD7]">Stripe</strong>, prestataire de services de paiement certifié PCI-DSS. PrimeX ne stocke aucune donnée bancaire sur ses serveurs.</p>
        <p>Les moyens de paiement acceptés sont : carte bancaire (Visa, Mastercard, American Express) et tout moyen proposé par Stripe selon la localisation du Client.</p>
        <p>En cas d'échec de paiement, l'accès aux fonctionnalités premium sera suspendu dans un délai de 7 jours. Le Client sera notifié par email et pourra régulariser sa situation depuis son espace « Paramètres ».</p>
      </Section>

      <Section title="5. Renouvellement et résiliation">
        <p>Les abonnements sont à renouvellement automatique mensuel. Le Client est débité chaque mois à la date anniversaire de sa souscription.</p>
        <p>Le Client peut résilier son abonnement à tout moment depuis la rubrique <strong className="text-[#F2EDD7]">Paramètres → Abonnement</strong> de la plateforme. La résiliation prend effet à la fin de la période de facturation en cours ; le Client conserve l'accès aux fonctionnalités jusqu'à cette date.</p>
        <p>Aucun remboursement au prorata n'est accordé pour les jours non utilisés suite à une résiliation en cours de période.</p>
      </Section>

      <Section title="6. Droit de rétractation">
        <p>Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation de 14 jours ne s'applique pas aux contenus numériques dont l'exécution a commencé avant la fin du délai de rétractation, avec l'accord préalable exprès du consommateur.</p>
        <p>En souscrivant à un abonnement PrimeX et en accédant immédiatement aux fonctionnalités, le Client reconnaît expressément renoncer à son droit de rétractation.</p>
        <p>Toutefois, PrimeX propose un <strong className="text-[#D4AF37]">essai gratuit de 14 jours</strong> sans carte bancaire requise, permettant au Client d'évaluer la plateforme avant tout engagement financier.</p>
      </Section>

      <Section title="7. Remboursements">
        <p>Hors disposition légale contraire, les abonnements ne sont pas remboursables une fois le paiement effectué.</p>
        <p>À titre exceptionnel, PrimeX pourra étudier les demandes de remboursement adressées à <a href="mailto:support@primex-trading.com" className="text-[#D4AF37] hover:underline">support@primex-trading.com</a> dans les 48 heures suivant le premier paiement, en cas de dysfonctionnement avéré de la plateforme imputable à PrimeX.</p>
      </Section>

      <Section title="8. Obligations de PrimeX">
        <p>PrimeX s'engage à :</p>
        <ul>
          <li>Fournir l'accès aux fonctionnalités décrites pour le forfait souscrit</li>
          <li>Maintenir la disponibilité de la plateforme (objectif : 99 % de disponibilité mensuelle, hors maintenances planifiées)</li>
          <li>Notifier le Client par email en cas de maintenance programmée supérieure à 2 heures</li>
          <li>Protéger les données personnelles conformément à la réglementation RGPD</li>
        </ul>
        <p>PrimeX ne garantit pas les résultats financiers des analyses ou signaux produits par la plateforme. Les outils fournis sont à caractère éducatif et informatif uniquement.</p>
      </Section>

      <Section title="9. Obligations du Client">
        <p>Le Client s'engage à :</p>
        <ul>
          <li>Fournir des informations exactes lors de l'inscription et du paiement</li>
          <li>Ne pas partager ses identifiants de connexion</li>
          <li>Utiliser la plateforme conformément aux CGU</li>
          <li>Ne pas tenter de contourner les mécanismes de paiement ou de contrôle d'accès</li>
        </ul>
      </Section>

      <Section title="10. Responsabilité">
        <p className="font-bold text-[#ef4444]">Les analyses, signaux et informations fournis par PrimeX ont une vocation exclusivement éducative et informative. Ils ne constituent pas des conseils en investissement au sens de la réglementation financière.</p>
        <p>PrimeX ne saurait être tenu responsable des pertes financières, directes ou indirectes, résultant de l'utilisation des outils et informations mis à disposition.</p>
        <p>La responsabilité de PrimeX est limitée, dans tous les cas, au montant des sommes effectivement versées par le Client au cours des 3 derniers mois précédant le fait générateur.</p>
      </Section>

      <Section title="11. Force majeure">
        <p>PrimeX ne saurait être tenu responsable en cas d'inexécution de ses obligations due à un événement de force majeure au sens de l'article 1218 du Code civil, incluant notamment les pannes d'infrastructure d'hébergement tiers, les cyberattaques ou les dysfonctionnements d'APIs tierces (Stripe, OpenAI, etc.).</p>
      </Section>

      <Section title="12. Données personnelles">
        <p>Le traitement des données personnelles collectées dans le cadre de la vente est régi par notre <a href="/legal/privacy" className="text-[#D4AF37] hover:underline">Politique de confidentialité</a>, conforme au Règlement Général sur la Protection des Données (RGPD).</p>
      </Section>

      <Section title="13. Litiges et droit applicable">
        <p>Les présentes CGV sont soumises au droit français. En cas de litige, le Client est invité à contacter PrimeX en premier lieu à l'adresse <a href="mailto:support@primex-trading.com" className="text-[#D4AF37] hover:underline">support@primex-trading.com</a> afin de trouver une solution amiable.</p>
        <p>À défaut d'accord amiable, les tribunaux français seront seuls compétents.</p>
        <p>Conformément aux articles L.612-1 et suivants du Code de la consommation, le Client consommateur a la possibilité de recourir gratuitement à un médiateur de la consommation.</p>
      </Section>

      <Section title="14. Contact">
        <p>Pour toute question relative aux présentes CGV ou à votre abonnement :</p>
        <ul>
          <li><strong className="text-[#F2EDD7]">Email :</strong> <a href="mailto:support@primex-trading.com" className="text-[#D4AF37] hover:underline">support@primex-trading.com</a></li>
          <li><strong className="text-[#F2EDD7]">Plateforme :</strong> Paramètres → Support</li>
        </ul>
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
