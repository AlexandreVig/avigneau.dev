# Site Portfolio

Le site que vous regardez. Un portfolio thème Windows XP construit comme un
mini shell de bureau — un système de fichiers virtuel, un gestionnaire de
fenêtres et un lanceur de shell, le tout dans le navigateur sans framework
de gestion d'état.

## Stack technique

- **Astro** pour le shell statique
- **TypeScript** partout
- **CSS pur** avec des variables CSS pour le thème
- **Cloudflare Pages** pour l'hébergement

L'application est livrée en site entièrement statique — pas de serveur, pas de
framework d'hydratation. Tout ce qui semble "dynamique" (fenêtres, système de
fichiers, applications) est du DOM vanilla et du TypeScript chargé à la demande
via le code splitting de Vite.

## Système de fichiers virtuel

Le contenu est organisé dans un arbre déclaratif. Chaque `FileNode` contient un
`load()` paresseux — Vite découpe chaque fichier en son propre chunk, donc seul
le contenu que vous ouvrez réellement est téléchargé.

```ts
export interface FileNode {
  kind: 'file';
  name: string;
  ext: string;
  // Chargé uniquement quand le fichier est ouvert.
  load: () => Promise<string>;
}

// Exemple d'entrée dans tree.ts :
{
  kind: 'file',
  name: 'About Me.md',
  ext: '.md',
  load: () => import('../content/about.md?raw').then((m) => m.default),
}
```

L'arbre contient aussi des `FolderNode` et `ShortcutNode`. Les raccourcis
résolvent vers un lancement d'application plutôt qu'un fichier — utilisés pour
les icônes du bureau comme "My Computer".

## Lanceur de shell

Chaque action d'ouverture — double-clic sur une icône du bureau, menu démarrer,
explorateur — passe par un seul appel `launch()`. Il résout le chemin, détermine
la bonne application à partir de l'extension du fichier, et transmet à `appHost`.

```ts
export async function launch(req: LaunchRequest): Promise<void> {
  let file: FileHandle | null = null;

  if (req.path) {
    const node = resolve(req.path);
    if (node?.kind === "file") {
      file = await readFile(req.path);
    }
  }

  const appId = req.appId ?? (file ? getFileType(file.ext).defaultAppId : null);
  await appHost.launch({ appId, file, args: req.args });
}
```

## Hôte d'application

`AppHost` gère le cycle de vie complet des applications : import dynamique,
déduplication d'instances, routage du focus et démontage. Les applications
s'enregistrent comme des entrées `AppManifest` avec un `kind` :

- `singleton` — au maximum une instance
- `multi` — nouvelle fenêtre à chaque fois (Explorer)
- `document` — une instance par chemin de fichier (Notepad)

Quand vous ouvrez le même fichier deux fois, `AppHost` donne le focus à la
fenêtre existante au lieu de monter une deuxième copie. La clé d'instance est
dérivée du chemin du fichier :

```ts
private computeInstanceId(manifest, file, args): string {
  if (manifest.kind === 'singleton') return manifest.id;
  if (manifest.kind === 'multi')     return `${manifest.id}#${++this.multiCounter}`;
  // document : indexé par le chemin du fichier, donc le même fichier
  // correspond toujours à la même fenêtre — le rouvrir donne juste le focus.
  return `${manifest.id}:${file?.path ?? args?.path}`;
}
```

## Gestionnaire de fenêtres

Les fenêtres sont de simples nœuds DOM ajoutés à `#desktop`. Le gestionnaire
suit la position, le z-index et l'état réduit/maximisé, et connecte les
interactions de glissement et de redimensionnement sans aucune bibliothèque externe.

Le glissement fonctionne en enregistrant la position de la souris au `mousedown`
sur la `title-bar`, puis en suivant les deltas. Un div transparent est injecté
sur le bureau pendant le glissement pour empêcher le contenu de type iframe
d'avaler les événements souris en plein glissement.

```ts
el.addEventListener("mousedown", (e) => {
  const titleBar = (e.target as Element).closest(".title-bar");
  if (titleBar && !isButton && !state.isMaximized) {
    isDragging = true;
    document.body.appendChild(cover); // overlay anti-capture
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }
});
```

Le placement en cascade est automatique — chaque nouvelle fenêtre s'ouvre 30px
en dessous et à droite de la précédente, avec un cycle tous les 8.

## Découpage du code

Chaque application et chaque fichier de contenu est un import dynamique séparé.
Au premier chargement, le navigateur ne récupère que le HTML du shell, le CSS
du bureau et le script d'entrée. Ouvrir Notepad charge le chunk notepad. Ouvrir
un fichier markdown charge le chunk de contenu de ce fichier. L'explorateur et
le moteur de rendu markdown vivent chacun dans leur propre chunk aussi — rien ne
se charge tant que vous ne le demandez pas.

## Source

[github.com/AlexandreVig/avigneau.dev](https://github.com/AlexandreVig/avigneau.dev)
