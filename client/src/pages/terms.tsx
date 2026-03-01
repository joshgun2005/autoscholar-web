import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Dernière mise à jour : 22 janvier 2026</p>

          <h2>1. Acceptation des conditions</h2>
          <p>
            En accédant et en utilisant VQuant ("le Service"), disponible sur <strong>www.vquant.ai</strong>,
            vous acceptez d'être lié par ces Conditions d'utilisation. Si vous n'acceptez pas ces conditions,
            veuillez ne pas utiliser le Service.
          </p>

          <h2>2. Description du service</h2>
          <p>
            VQuant est une plateforme d'analyse financière propulsée par intelligence artificielle qui fournit :
          </p>
          <ul>
            <li>Analyses financières via Claude AI de Anthropic</li>
            <li>Accès à 265+ endpoints de données financières et de marché</li>
            <li>Outils d'analyse quantitative (Monte Carlo, VaR, optimisation de portefeuille)</li>
            <li>Extraction de contenu web et PDFs</li>
            <li>Recherche web multi-sources</li>
            <li>Exécution de code Python personnalisé pour analyses avancées</li>
          </ul>

          <h2>3. Utilisation acceptable</h2>

          <h3>3.1 Vous acceptez de NE PAS :</h3>
          <ul>
            <li>Utiliser le Service à des fins illégales ou non autorisées</li>
            <li>Tenter d'accéder à des systèmes ou données non autorisés</li>
            <li>Abuser des APIs ou générer une charge excessive</li>
            <li>Revendre ou redistribuer les données obtenues via le Service</li>
            <li>Utiliser le Service pour spammer ou harceler</li>
            <li>Tenter de contourner les limitations de sécurité</li>
            <li>Extraire automatiquement (scraper) le Service</li>
          </ul>

          <h3>3.2 Vous acceptez de :</h3>
          <ul>
            <li>Fournir des informations exactes lors de la création de compte</li>
            <li>Maintenir la confidentialité de vos identifiants</li>
            <li>Respecter les Conditions d'utilisation des APIs tierces</li>
            <li>Utiliser les analyses à des fins d'information uniquement</li>
          </ul>

          <h2>4. Comptes utilisateurs</h2>
          <ul>
            <li>Vous êtes responsable de la sécurité de votre compte</li>
            <li>Un compte par personne</li>
            <li>Nous nous réservons le droit de suspendre ou supprimer des comptes en cas de violation</li>
            <li>Utilisez le token de récupération fourni lors de la création pour récupérer votre compte</li>
          </ul>

          <h2>5. Propriété intellectuelle</h2>
          <ul>
            <li>Le Service et son contenu original sont propriété de VQuant</li>
            <li>Les données financières sont fournies par nos partenaires API (FMP, etc.)</li>
            <li>Les analyses générées par Claude AI appartiennent à Anthropic</li>
            <li>Vos requêtes et analyses vous appartiennent</li>
          </ul>

          <h2>6. Disclaimer financier</h2>
          <p className="font-semibold text-amber-600 dark:text-amber-500">
            ⚠️ IMPORTANT : Ce service fournit des informations à but éducatif uniquement.
          </p>
          <ul>
            <li><strong>PAS de conseil financier</strong> : Les analyses ne constituent pas des recommandations d'investissement</li>
            <li><strong>Aucune garantie</strong> : Les données et prédictions peuvent être inexactes</li>
            <li><strong>Risques</strong> : L'investissement comporte des risques de perte en capital</li>
            <li><strong>Vérification</strong> : Toujours vérifier les informations avec des sources officielles</li>
            <li><strong>Conseiller professionnel</strong> : Consultez un conseiller financier agréé avant toute décision d'investissement</li>
          </ul>

          <h2>7. Limitations de responsabilité</h2>
          <p>
            LE SERVICE EST FOURNI "TEL QUEL" SANS GARANTIE D'AUCUNE SORTE.
            NOUS NE SOMMES PAS RESPONSABLES DE :
          </p>
          <ul>
            <li>Pertes financières résultant de l'utilisation du Service</li>
            <li>Interruptions ou indisponibilités du Service</li>
            <li>Inexactitudes dans les données fournies par les APIs tierces</li>
            <li>Erreurs dans les analyses générées par l'IA</li>
            <li>Bugs ou dysfonctionnements du code Python personnalisé</li>
          </ul>

          <h2>8. Utilisation des APIs tierces</h2>
          <p>Le Service utilise plusieurs APIs tierces. Vous reconnaissez que :</p>
          <ul>
            <li>Ces services ont leurs propres conditions d'utilisation</li>
            <li>Nous ne sommes pas responsables de leur disponibilité</li>
            <li>Les coûts d'API sont supportés par VQuant dans les limites raisonnables</li>
            <li>Un usage excessif peut être limité ou facturé</li>
          </ul>

          <h2>9. Code Python personnalisé</h2>
          <p>
            L'outil "execute_custom_python_analysis" permet l'exécution de code Python arbitraire.
            En l'utilisant, vous reconnaissez que :
          </p>
          <ul>
            <li>Le code s'exécute dans un environnement semi-contrôlé</li>
            <li>Il existe un timeout de 90 secondes</li>
            <li>L'accès système est restreint pour sécurité</li>
            <li>Vous êtes responsable du code que vous générez</li>
          </ul>

          <h2>10. Partage de contenu</h2>
          <p>
            Lorsque vous partagez une analyse :
          </p>
          <ul>
            <li>Elle devient publiquement accessible via un lien unique</li>
            <li>Nous ne sommes pas responsables du contenu partagé</li>
            <li>Nous nous réservons le droit de supprimer du contenu inapproprié</li>
            <li>Vous accordez une licence pour afficher votre contenu partagé</li>
          </ul>

          <h2>11. Modifications du service</h2>
          <p>
            Nous nous réservons le droit de :
          </p>
          <ul>
            <li>Modifier ou interrompre le Service à tout moment</li>
            <li>Changer ces Conditions d'utilisation</li>
            <li>Ajouter ou retirer des fonctionnalités</li>
            <li>Limiter l'accès à certaines fonctionnalités</li>
          </ul>

          <h2>12. Résiliation</h2>
          <ul>
            <li>Vous pouvez supprimer votre compte à tout moment</li>
            <li>Nous pouvons suspendre ou supprimer votre compte en cas de violation</li>
            <li>Les données peuvent être conservées pour raisons légales ou de sécurité</li>
          </ul>

          <h2>13. Loi applicable</h2>
          <p>
            Ces conditions sont régies par les lois applicables de votre juridiction.
            Tout litige sera soumis aux tribunaux compétents.
          </p>

          <h2>14. Contact</h2>
          <p>
            Pour toute question concernant ces Conditions d'utilisation :
          </p>
          <p className="font-semibold text-xl">
            <a href="mailto:admin@vquant.ai" className="text-primary hover:underline">
              admin@vquant.ai
            </a>
          </p>

          <hr className="my-8" />

          <p className="text-sm text-muted-foreground text-center">
            En utilisant VQuant, vous acceptez ces Conditions d'utilisation et notre Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
