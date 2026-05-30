import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — PrimeX',
}

const LAST_UPDATE = '23 mai 2026'

export default function CGUPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="text-2xl font-black text-white mb-2">Conditions Générales d&apos;Utilisation</h1>
      <p className="text-[#555] text-xs mb-10">Dernière mise à jour : {LAST_UPDATE}</p>

      <Section title="1. Présentation de la plateforme">
        <p>PrimeX (ci-après « la Plateforme ») est un service SaaS de trading informatif et éducatif proposant des outils d'analyse de marchés financiers basés sur l'intelligence artificielle. La Plateforme est éditée et exploitée par PrimeX SAS.</p>
        <p>L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la Plateforme.</p>
      </Section>

      <Section title="2. Conditions d'accès">
        <p>L'accès à la Plateforme est réservé aux personnes majeures (18 ans et plus). En vous inscrivant, vous certifiez avoir l'âge légal requis dans votre pays de résidence pour accéder à des contenus financiers.</p>
        <p>Pour accéder aux fonctionnalités, vous devez créer un compte avec une adresse email valide et un mot de passe sécurisé. Vous êtes responsable de la confidentialité de vos identifiants.</p>
      </Section>

      <Section title="3. Description des forfaits">
        <p><strong className="text-[#D4AF37]">Gratuit :</strong> Accès au tableau de bord, actualités marchés et calendrier économique uniquement.</p>
        <p><strong className="text-[#38bdf8]">Starter X (39€/mois) :</strong> Tous les modules PrimeX, 1 million de tokens IA/mois, IA de dernière génération, mises à jour incluses.</p>
        <p><strong className="text-[#D4AF37]">Pro X (99€/mois) :</strong> Tous les modules PrimeX, 3 millions de tokens IA/mois, IA de dernière génération, mises à jour incluses.</p>
        <p><strong className="text-[#a78bfa]">Expert X (199€/mois) :</strong> Tous les modules PrimeX, 8 millions de tokens IA/mois, IA de dernière génération, mises à jour incluses.</p>
      </Section>

      <Section title="4. Gestion des abonnements">
        <p>Les abonnements sont mensuels et se renouvellent automatiquement. Vous pouvez annuler votre abonnement à tout moment depuis votre espace « Paramètres ». L'annulation prend effet à la fin de la période de facturation en cours.</p>
        <p>Les paiements sont traités de manière sécurisée via Stripe. PrimeX ne stocke aucune donnée bancaire.</p>
        <p>Aucun remboursement ne sera effectué pour les périodes partiellement utilisées, sauf disposition légale contraire.</p>
      </Section>

      <Section title="5. Avertissement financier et responsabilités">
        <p className="font-bold text-[#ef4444]">Les informations, analyses et signaux fournis par la Plateforme sont exclusivement destinés à des fins éducatives et informatives. Ils ne constituent en aucun cas des conseils en investissement, des recommandations financières ou des incitations à l'achat ou à la vente de tout actif financier.</p>
        <p>Le trading de produits financiers implique un risque substantiel de perte et n'est pas adapté à tous les investisseurs. Les performances passées ne préjugent pas des résultats futurs.</p>
        <p>PrimeX décline toute responsabilité pour les pertes financières directes ou indirectes résultant de l'utilisation des informations fournies sur la Plateforme.</p>
      </Section>

      <Section title="6. Utilisation acceptable">
        <p>Il est interdit d'utiliser la Plateforme pour :</p>
        <ul>
          <li>Accéder ou tenter d'accéder à des données d'autres utilisateurs</li>
          <li>Effectuer de l'ingénierie inverse sur les algorithmes de la Plateforme</li>
          <li>Revendre, redistribuer ou partager des informations premium sans autorisation</li>
          <li>Utiliser des bots automatisés pour scraper le contenu</li>
          <li>Toute activité illégale ou contraire à l'ordre public</li>
        </ul>
      </Section>

      <Section title="7. Suspension et résiliation de compte">
        <p>PrimeX se réserve le droit de suspendre ou de résilier tout compte qui violerait les présentes CGU, sans préavis et sans remboursement.</p>
        <p>En cas de non-paiement, l'accès aux fonctionnalités premium sera suspendu dans un délai de 7 jours suivant le défaut de paiement.</p>
        <p>Vous pouvez supprimer votre compte à tout moment depuis les paramètres. Les données seront effacées conformément à notre politique de confidentialité.</p>
      </Section>

      <Section title="8. Propriété intellectuelle">
        <p>L'ensemble du contenu de la Plateforme (code, design, algorithmes, signaux, analyses) est la propriété exclusive de PrimeX SAS et est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.</p>
      </Section>

      <Section title="9. Modifications des CGU">
        <p>PrimeX se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email des modifications significatives. La poursuite de l'utilisation après notification vaut acceptation des nouvelles conditions.</p>
      </Section>

      <Section title="10. Droit applicable et juridiction">
        <p>Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou exécution relèvera de la compétence exclusive des tribunaux français.</p>
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
