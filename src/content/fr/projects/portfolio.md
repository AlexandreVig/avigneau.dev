# Site Portfolio

Le site que vous regardez. Ouvrez-le sur un ordinateur et vous obtenez un
environnement Windows XP — fenêtres déplaçables, barre des tâches, menu
démarrer et Clippy. Ouvrez-le sur un téléphone et vous obtenez un iPod Touch
première génération. Même URL, deux interfaces complètement différentes,
zéro framework.

Construit avec Astro, TypeScript pur, CSS pur, et déployé sur Cloudflare Pages.

---

## L'idée centrale : une page, deux shells

Les deux shells sont rendus côté serveur dans le même document HTML. Un script
synchrone dans `<head>` lit la taille de l'écran avant le premier affichage et
pose un attribut `data-shell`. Le CSS cache immédiatement le shell perdant. Un
script module supprime ensuite son DOM et charge dynamiquement uniquement le
bootstrap du shell gagnant.

```
Bureau (≥ 769 px de large)   →  shell Windows XP
Mobile (≤ 768 px / tactile)  →  shell iPod Touch 1G
```

Le code du shell inutilisé n'est jamais téléchargé.
La détection vit à deux endroits qui doivent rester synchronisés : le `<script>`
inline dans `BaseLayout.astro` (s'exécute avant l'affichage) et le sélecteur de
module dans `index.astro` (supprime le DOM mort, importe le bon bootstrap).

---

## Couche de contenu : système de fichiers virtuel

Tout le contenu — fichiers markdown, PDFs, descriptions de projets — vit dans
un arbre déclaratif partagé par les deux shells. Chaque nœud fichier porte une
fonction `load()` paresseuse. Vite transforme chaque `import(…?raw)` en son
propre chunk, donc le contenu d'un fichier n'est téléchargé que lorsqu'un
utilisateur l'ouvre réellement.

```ts
{
  kind: 'file',
  name: 'About Me.md',
  ext: '.md',
  load: () => import('../content/about.md?raw').then((m) => m.default),
}
```

L'arbre contient trois types de nœuds : `FileNode`, `FolderNode` et
`ShortcutNode`. Les raccourcis résolvent vers un lancement d'application plutôt
que vers un fichier — utilisés pour les icônes du bureau comme "My Computer".

---

## Shell bureau — Windows XP

### Gestionnaire de fenêtres

Les fenêtres sont de simples `<div>` ajoutés à `#desktop`. Le gestionnaire suit
la position, le z-index et l'état réduit/maximisé entièrement en DOM vanilla.

Le glissement fonctionne en enregistrant le décalage du pointeur au `mousedown`
sur la barre de titre, puis en suivant les deltas sur `window`. Un div
transparent est injecté pendant le glissement pour empêcher un contenu riche
d'avaler les événements souris en plein déplacement. Les nouvelles fenêtres se
placent en cascade automatiquement : chacune s'ouvre 30 px en dessous et à
droite de la précédente, avec un cycle toutes les 8.

```ts
el.addEventListener('mousedown', (e) => {
  const titleBar = (e.target as Element).closest('.title-bar');
  if (titleBar && !isButton && !state.isMaximized) {
    isDragging = true;
    document.body.appendChild(cover); // overlay anti-capture
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
});
```

### Hôte d'application et cycle de vie

Chaque application est un import dynamique. Les applications déclarent un `kind`
qui contrôle le nombre d'instances autorisées :

- **singleton** — une seule instance (Outlook Express, Minesweeper)
- **multi** — nouvelle fenêtre à chaque lancement (Explorer, Outlook Compose)
- **document** — une instance par chemin de fichier, remise au premier plan si déjà ouverte (Notepad, Adobe Reader)

Si vous tentez d'ouvrir le même document deux fois, `AppHost` remet le focus sur
la fenêtre existante au lieu d'en monter une deuxième. Explorer ajoute une
surcharge `findExistingInstance` qui déduplique par le dossier affiché au moment
du clic, pas par celui où il a été ouvert à l'origine.

### Applications intégrées

| Application | Rôle |
|---|---|
| **Explorer** | Naviguer dans le système de fichiers virtuel |
| **Notepad** | Afficher les fichiers `.md` et `.txt` |
| **Adobe Reader** | Afficher le contenu `.pdf` |
| **Outlook Express** | Vue boîte de réception |
| **Outlook Compose** | Formulaire de contact relié à l'API edge |
| **Minesweeper** | Démineur jouable, avec affichage LED personnalisé |
| **BSOD** | Déclenché par les fichiers `.exe` |
| **About** | Dialogue par application (bouton fermer uniquement, pas d'entrée dans la barre des tâches) |

Les huit applications sont des chunks séparés — aucune n'est téléchargée avant
d'être ouverte.

### Clippy

Clippy est un agent autonome superposé au bureau. Il dispose de trois
sous-systèmes indépendants qui tournent en parallèle :

**AnimationEngine** — pilote une spritesheet à 15 fps via une table de données
d'animation. Il distingue les animations verrouillées (non interruptibles), les
animations de regard (face au curseur) et l'état repos par défaut.

**MovementController** — Clippy erre sur le bureau de lui-même, choisissant une
cible aléatoire dans un rayon de 350 px toutes les 3 à 6 secondes et y glissant
via une transition CSS. Le glisser-déposer met l'autonomie en pause ; relâcher
la reprend. À l'arrivée, il joue une courte animation de réaction.

**Réactions aux événements** — Clippy écoute les événements DOM personnalisés
émis par l'hôte d'application :

| Événement | Réaction de Clippy |
|---|---|
| Ouvrir Notepad | Animation `Writing` |
| Ouvrir Minesweeper | `GetTechy` |
| Fermer une fenêtre | `Wave` ou `GoodBye` |
| Gagner au Minesweeper | `Congratulate` |
| 2 min d'inactivité | `IdleSnooze` |

Le suivi du curseur (limité à 200 ms) fait regarder Clippy vers la souris
lorsqu'il est dans son état par défaut.

---

## Shell mobile — iPod Touch 1G

### Navigateur

Le shell iPod remplace le gestionnaire de fenêtres par une pile de navigation
linéaire. Il n'y a qu'un seul écran visible à la fois — l'accueil ou une
application ouverte.

`openApp()` crée un cadre plein écran, charge dynamiquement le module de
l'application, et démarre l'animation de glissement vers le haut en parallèle
pour que le cadre soit déjà visible lorsque le `mount()` de l'application
s'exécute. Un `AbortController` est transmis à chaque application et signalé
lors du retour à l'accueil, offrant un mécanisme d'annulation propre.
La réentrance pendant une animation en cours est silencieusement ignorée,
reproduisant le comportement de l'iOS original.

```ts
// Démarrer l'animation et charger le module en parallèle.
const entered = frame.playEnter();
const module = await manifest.loader(); // chunk Vite dédié

await module.default.mount({ root, instanceId, signal: abort.signal, host });
await entered; // le cadre est maintenant entièrement visible
```

### Applications

L'écran d'accueil reproduit la disposition originale de l'iPod Touch : une grille
d'icônes à 4 colonnes au-dessus d'un dock fixe de quatre applications.

| Application | Emplacement | Rôle |
|---|---|---|
| **Safari** | Dock | Navigateur de projets |
| **Mail** | Dock | Formulaire de contact |
| **Notes** | Dock | Lecteur de contenu markdown |
| **Music** | Dock | Lecteur de musique |
| **Calculator** | Grille | Calculatrice fonctionnelle |
| **Weather / Stocks / Maps / YouTube** | Grille | Callbacks décoratifs « Impossible de se connecter » |

---

## Systèmes partagés

### Internationalisation

Toutes les chaînes de l'interface passent par une fonction `t(clé, ...args)`
typée, appuyée sur des dictionnaires plats EN et FR. Les clés sont typées comme
une union dérivée du dictionnaire anglais, donc une traduction manquante est
une erreur de compilation. La langue est détectée depuis `navigator.language`
à la première visite et sauvegardée dans `localStorage` ; changer de langue
recharge la page.

```ts
t('explorer.itemCount', 3) // → "3 items" ou "3 éléments"
```

### API de contact

Les applications Outlook Compose et Mail envoient leurs données à `/api/contact`,
une Cloudflare Pages Function (la seule route non-statique du projet). Elle :

1. Limite les requêtes par IP via un binding Cloudflare Rate Limiter
2. Valide chaque champ et vérifie un honeypot
3. Envoie le message via l'API Resend

---

## Ce que le navigateur télécharge au premier chargement

À la première visite, le navigateur reçoit uniquement le HTML de la page, le CSS
du shell actif et un petit script d'entrée. Tout le reste — modules d'application,
fichiers de contenu, le moteur markdown, la spritesheet de Clippy — est chargé
à la demande. Le bundle JavaScript complet du shell inutilisé n'est jamais
téléchargé.

---

## Source

[github.com/AlexandreVig/avigneau.dev](https://github.com/AlexandreVig/avigneau.dev)
