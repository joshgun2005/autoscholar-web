# 📁 Logos pour Présentations Beamer

## Instructions

Pour ajouter votre logo VibeQuant aux présentations :

### 1. Ajouter votre logo
Placez votre fichier logo dans ce dossier :
- **Nom recommandé** : `logo.png` ou `vibequant-logo.png`
- **Format** : PNG avec fond transparent
- **Dimensions recommandées** :
  - Horizontal : 400x100 px (pour slide de titre)
  - Carré : 200x200 px (pour slides intérieures)
- **Résolution** : 300 DPI pour qualité optimale

### 2. Activer le logo dans Beamer
Le service décommente automatiquement la ligne logo dans le .tex si un fichier `logo.png` existe.

### 3. Logo actuel
Si aucun logo n'est fourni, les présentations sont générées sans logo (design épuré).

### 4. Personnalisation avancée
Pour modifier la position ou taille du logo, éditez :
`server/services/beamerSlidesService.ts`

Ligne à modifier :
```latex
\\logo{\\includegraphics[height=0.8cm]{public/logos/logo.png}}
```

Changez `height=0.8cm` selon vos besoins.

---

**Note** : Le logo sera automatiquement inclus dans toutes les présentations générées si le fichier existe!
