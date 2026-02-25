import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Privacy() {
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
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Dernière mise à jour : 22 janvier 2026</p>

          <h2>1. Introduction</h2>
          <p>
            Bienvenue sur VibeQuant ("nous", "notre" ou "nos"). Nous nous engageons à protéger votre vie privée.
            Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations
            personnelles lorsque vous utilisez notre plateforme d'analyse financière propulsée par IA sur <strong>www.vquant.ai</strong>.
          </p>

          <h2>2. Informations que nous collectons</h2>

          <h3>2.1 Informations fournies par vous</h3>
          <ul>
            <li><strong>Compte utilisateur</strong> : Nom d'utilisateur, mot de passe hashé, token de récupération</li>
            <li><strong>Requêtes de recherche</strong> : Questions et analyses que vous soumettez à la plateforme</li>
            <li><strong>Historique de conversation</strong> : Vos sessions d'analyse et leurs résultats</li>
          </ul>

          <h3>2.2 Informations automatiques</h3>
          <ul>
            <li><strong>Données techniques</strong> : Adresse IP, type de navigateur, timestamps</li>
            <li><strong>Cookies de session</strong> : Pour maintenir votre connexion (30 jours max)</li>
            <li><strong>Utilisation API</strong> : Tokens utilisés, coûts d'API pour statistiques</li>
          </ul>

          <h2>3. Comment nous utilisons vos informations</h2>
          <ul>
            <li>Fournir et améliorer nos services d'analyse financière</li>
            <li>Personnaliser votre expérience utilisateur</li>
            <li>Sauvegarder votre historique de conversation</li>
            <li>Générer des analyses via Claude AI et nos APIs partenaires</li>
            <li>Assurer la sécurité et prévenir les abus</li>
          </ul>

          <h2>4. Partage des données</h2>

          <h3>4.1 APIs tierces</h3>
          <p>Vos requêtes peuvent être envoyées aux services suivants pour traitement :</p>
          <ul>
            <li><strong>Anthropic (Claude AI)</strong> : Pour générer les analyses</li>
            <li><strong>Financial Modeling Prep</strong> : Pour données financières</li>
            <li><strong>Firecrawl</strong> : Pour extraction web et PDFs</li>
            <li><strong>Tavily</strong> : Pour recherche web intelligente</li>
            <li><strong>Exa</strong> : Pour recherche sémantique</li>
            <li><strong>SerpAPI</strong> : Pour recherche Google</li>
          </ul>
          <p>Ces services ont leurs propres politiques de confidentialité que nous vous encourageons à consulter.</p>

          <h3>4.2 Rapports partagés</h3>
          <p>
            Lorsque vous utilisez la fonction "Partager", votre analyse devient publiquement accessible via un lien unique.
            Ne partagez que des analyses que vous êtes à l'aise de rendre publiques.
          </p>

          <h2>5. Sécurité des données</h2>
          <ul>
            <li>Mots de passe hashés avec bcrypt</li>
            <li>Connexions HTTPS en production</li>
            <li>Cookies sécurisés (httpOnly, secure)</li>
            <li>Variables d'environnement pour clés API</li>
            <li>Validation des entrées utilisateur</li>
          </ul>

          <h2>6. Vos droits</h2>
          <p>Vous avez le droit de :</p>
          <ul>
            <li><strong>Accéder</strong> à vos données personnelles</li>
            <li><strong>Corriger</strong> des informations inexactes</li>
            <li><strong>Supprimer</strong> votre compte et données</li>
            <li><strong>Exporter</strong> votre historique de conversation</li>
            <li><strong>Vous opposer</strong> au traitement de vos données</li>
          </ul>

          <h2>7. Rétention des données</h2>
          <ul>
            <li><strong>Sessions de conversation</strong> : Conservées indéfiniment sauf suppression</li>
            <li><strong>Cookies de session</strong> : 30 jours</li>
            <li><strong>Rapports partagés</strong> : Conservés indéfiniment sauf suppression</li>
          </ul>

          <h2>8. Cookies</h2>
          <p>
            Nous utilisons uniquement des cookies essentiels pour la gestion de session.
            Aucun cookie de tracking ou publicité.
          </p>

          <h2>9. Modifications de cette politique</h2>
          <p>
            Nous pouvons mettre à jour cette politique de confidentialité occasionnellement.
            La date de "Dernière mise à jour" en haut de cette page indique quand la politique a été modifiée pour la dernière fois.
          </p>

          <h2>10. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous à :
          </p>
          <p className="font-semibold">
            <a href="mailto:admin@vquant.ai" className="text-primary hover:underline">
              admin@vquant.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
