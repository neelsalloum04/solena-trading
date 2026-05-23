import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — PrimeX',
}

const LAST_UPDATE = '23 mai 2026'

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-2xl font-black text-white mb-2">Politique de Confidentialité</h1>
      <p className="text-[#555] text-xs mb-10">Dernière mise à jour : {LAST_UPDATE} · Conforme RGPD</p>

      <Section title="1. Responsable du traitement">
        <p>PrimeX SAS est responsable du traitement de vos données personnelles collectées via la Plateforme. Pour toute question relative à vos données, contactez-nous à : <span className="text-[#D4AF37]">privacy@primex.ai</span></p>
      </Section>

      <Section title="2. Données collectées">
        <p>Nous collectons les données suivantes :</p>
        <ul>
          <li><strong className="text-white">Données d'identification :</strong> Nom, adresse email, identifiant utilisateur</li>
          <li><strong className="text-white">Données de paiement :</strong> Informations de facturation transmises à Stripe (PrimeX ne stocke pas les données bancaires)</li>
          <li><strong className="text-white">Données d'utilisation :</strong> Pages visitées, fonctionnalités utilisées, analyses effectuées</li>
          <li><strong className="text-white">Données techniques :</strong> Adresse IP, type de navigateur, système d'exploitation</li>
          <li><strong className="text-white">Données de trading :</strong> Analyses soumises, signaux consultés (images de graphiques anonymisées)</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>Fournir et améliorer les services de la Plateforme</li>
          <li>Gérer votre compte et votre abonnement</li>
          <li>Traiter les paiements via Stripe</li>
          <li>Personnaliser votre expérience</li>
          <li>Envoyer des notifications relatives à votre compte (paiements, renouvellements)</li>
          <li>Détecter et prévenir les usages frauduleux</li>
          <li>Respecter nos obligations légales</li>
        </ul>
      </Section>

      <Section title="4. Base légale du traitement">
        <p>Le traitement de vos données repose sur :</p>
        <ul>
          <li><strong className="text-white">Exécution du contrat :</strong> Nécessaire à la fourniture des services</li>
          <li><strong className="text-white">Intérêt légitime :</strong> Amélioration des services, sécurité</li>
          <li><strong className="text-white">Consentement :</strong> Communications marketing (révocable à tout moment)</li>
          <li><strong className="text-white">Obligation légale :</strong> Conservation des données comptables</li>
        </ul>
      </Section>

      <Section title="5. Conservation des données">
        <p>Vos données sont conservées :</p>
        <ul>
          <li>Données de compte : Pendant la durée de l'abonnement + 3 ans après résiliation</li>
          <li>Données de paiement : 10 ans (obligation légale comptable)</li>
          <li>Données de connexion/logs : 12 mois maximum</li>
          <li>Analyses IA : 90 jours puis suppression automatique</li>
        </ul>
        <p>Après suppression de compte, toutes vos données personnelles sont effacées dans un délai de 30 jours, à l'exception des données soumises à obligation légale de conservation.</p>
      </Section>

      <Section title="6. Partage des données">
        <p>Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées uniquement avec :</p>
        <ul>
          <li><strong className="text-white">Stripe :</strong> Traitement des paiements (conforme PCI-DSS)</li>
          <li><strong className="text-white">Supabase :</strong> Hébergement base de données (serveurs en Europe)</li>
          <li><strong className="text-white">Anthropic / OpenAI :</strong> Traitement des requêtes IA (données anonymisées)</li>
          <li><strong className="text-white">Vercel :</strong> Hébergement de l'application</li>
        </ul>
        <p>Tous nos sous-traitants respectent le RGPD et disposent de garanties contractuelles adéquates.</p>
      </Section>

      <Section title="7. Cookies">
        <p>Nous utilisons des cookies essentiels au fonctionnement du service (authentification, préférences). Aucun cookie publicitaire n'est utilisé.</p>
        <ul>
          <li><strong className="text-white">Cookies de session Supabase :</strong> Authentification — durée de session</li>
          <li><strong className="text-white">Cookies de préférences :</strong> Langue, thème — 365 jours</li>
        </ul>
      </Section>

      <Section title="8. Vos droits (RGPD)">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong className="text-white">Droit d'accès :</strong> Obtenir une copie de vos données</li>
          <li><strong className="text-white">Droit de rectification :</strong> Corriger des données inexactes</li>
          <li><strong className="text-white">Droit à l'effacement :</strong> Demander la suppression de vos données</li>
          <li><strong className="text-white">Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
          <li><strong className="text-white">Droit d'opposition :</strong> Vous opposer à certains traitements</li>
          <li><strong className="text-white">Droit à la limitation :</strong> Limiter le traitement de vos données</li>
        </ul>
        <p>Pour exercer ces droits, contactez-nous à <span className="text-[#D4AF37]">privacy@primex.ai</span>. Nous répondrons dans un délai de 30 jours. Vous avez également le droit de déposer une réclamation auprès de la CNIL.</p>
      </Section>

      <Section title="9. Sécurité">
        <p>Nous mettons en œuvre des mesures de sécurité appropriées : chiffrement TLS, accès restreint aux données, authentification sécurisée, journalisation des accès, et audits réguliers de sécurité.</p>
      </Section>

      <Section title="10. Contact">
        <p>Délégué à la Protection des Données (DPO) : <span className="text-[#D4AF37]">privacy@primex.ai</span></p>
        <p>Autorité de contrôle française : CNIL — <span className="text-[#D4AF37]">www.cnil.fr</span></p>
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
