const fr: Record<string, string> = {
  // ── Explorer ────────────────────────────────────────────────────────────────
  'explorer.empty': 'Ce dossier est vide.',
  'explorer.items.one': '{0} \u00e9l\u00e9ment',
  'explorer.items.other': '{0} \u00e9l\u00e9ments',
  'explorer.address': 'Adresse',
  'explorer.go': 'Aller',
  'explorer.up': 'Dossier parent',
  'explorer.back': 'Pr\u00e9c\u00e9dent',
  'explorer.search': 'Rechercher',
  'explorer.folders': 'Dossiers',
  'explorer.about.description':
    'Un explorateur de fichiers fa\u00e7on Windows XP, int\u00e9gr\u00e9 \u00e0 ce portfolio. ' +
    'Source sur [GitHub](https://github.com/AlexandreVig/alexvig.dev).',
  'explorer.about.footer': 'Con\u00e7u avec Astro et TypeScript.',

  // ── Notepad ─────────────────────────────────────────────────────────────────
  'notepad.untitled': 'Sans titre',
  'notepad.about.description':
    'Un petit lecteur Markdown fa\u00e7on Windows XP, int\u00e9gr\u00e9 \u00e0 ce portfolio. ' +
    'Source sur [GitHub](https://github.com/AlexandreVig/alexvig.dev).',
  'notepad.about.footer': 'Con\u00e7u avec Astro, TypeScript et Marked.',

  // ── Outlook ─────────────────────────────────────────────────────────────────
  'outlook.createMail': 'Nouveau',
  'outlook.reply': 'R\u00e9pondre',
  'outlook.replyAll': 'R\u00e9p. tous',
  'outlook.forward': 'Transf\u00e9rer',
  'outlook.print': 'Imprimer',
  'outlook.delete': 'Supprimer',
  'outlook.sendRecv': 'Envoyer/Recv',
  'outlook.addresses': 'Adresses',
  'outlook.find': 'Rechercher',
  'outlook.foldersHeader': 'Dossiers',
  'outlook.contactsHeader': 'Contacts',
  'outlook.workingOnline': 'En ligne',
  'outlook.noItems': 'Aucun \u00e9l\u00e9ment \u00e0 afficher dans cette vue.',
  'outlook.noContacts':
    'Aucun contact \u00e0 afficher. Cliquez sur Contacts pour cr\u00e9er un nouveau contact.',
  'outlook.messageCount': '{0} message(s), {1} non lu(s)',
  'outlook.messageCountZero': '0 message(s)',
  'outlook.listFrom': 'De',
  'outlook.listSubject': 'Objet',
  'outlook.listReceived': 'Re\u00e7u',
  'outlook.readerFrom': 'De\u00a0:',
  'outlook.readerDate': 'Date\u00a0:',
  'outlook.readerTo': '\u00c0\u00a0:',
  'outlook.readerSubject': 'Objet\u00a0:',
  'outlook.about.description':
    'Un client e-mail fa\u00e7on Windows XP, servant \u00e9galement de formulaire de contact. ' +
    'Int\u00e9gr\u00e9 \u00e0 ce portfolio.',

  // ── Outlook folders ─────────────────────────────────────────────────────────
  'outlook.folder.inbox': 'Bo\u00eete de r\u00e9ception',
  'outlook.folder.outbox': 'Bo\u00eete d\u2019envoi',
  'outlook.folder.sent': '\u00c9l\u00e9ments envoy\u00e9s',
  'outlook.folder.deleted': '\u00c9l\u00e9ments supprim\u00e9s',
  'outlook.folder.drafts': 'Brouillons',

  // ── Outlook emails ──────────────────────────────────────────────────────────
  'email.alexandreNote.subject': 'Un mot du d\u00e9veloppeur',
  'email.alexandreNote.body': `
    <div style="font-family: Tahoma, sans-serif; font-size: 11px; padding: 12px;">
      <p>Salut\u00a0! 👋</p>
      <p>Merci d\u2019explorer mon portfolio. Ce clone d\u2019Outlook Express est
         en fait un vrai formulaire de contact\u00a0: cliquez sur <b>Nouveau</b> dans
         la barre d\u2019outils pour m\u2019envoyer un message.</p>
      <p>Vous pouvez me retrouver ici\u00a0:</p>
      <ul>
        <li><b>Email\u00a0:</b> <a href="mailto:alexandre.vigneau@epitech.eu">alexandre.vigneau@epitech.eu</a></li>
        <li><b>GitHub\u00a0:</b> <a href="https://github.com/AlexandreVig" target="_blank">github.com/AlexandreVig</a></li>
        <li><b>LinkedIn\u00a0:</b> <a href="https://linkedin.com/in/alexandrevigneau" target="_blank">linkedin.com/in/alexandrevigneau</a></li>
      </ul>
      <p>\u2014 Alexandre</p>
    </div>
  `,
  'email.billGates.subject': 'RE\u00a0: Votre portfolio',
  'email.billGates.body': `
    <div style="font-family: Tahoma, sans-serif; font-size: 11px; padding: 12px;">
      <p>Alexandre,</p>
      <p>Je dois dire que cette recr\u00e9ation de Windows XP est absolument remarquable.
         L\u2019attention aux d\u00e9tails \u2014 les d\u00e9grad\u00e9s de la barre de titre, le positionnement
         en cascade, m\u00eame les \u00e9tats de survol des boutons \u2014 \u00e7a me ram\u00e8ne
         directement en 2001.</p>
      <p>Si j\u2019embauchais encore des d\u00e9veloppeurs chez Microsoft, vous seriez
         en haut de ma liste. Continuez \u00e0 cr\u00e9er de belles choses.</p>
      <p style="margin-top: 16px;">Cordialement,<br /><b>Bill</b></p>
      <p style="color: #888; font-size: 10px; margin-top: 12px;">
        Envoy\u00e9 depuis ma Surface Pro sous Windows XP (si, si)
      </p>
    </div>
  `,
  'email.nigerianPrince.subject': 'URGENT\u00a0: Vous avez \u00e9t\u00e9 s\u00e9lectionn\u00e9\u00a0!!!',
  'email.nigerianPrince.body': `
    <div style="font-family: Tahoma, sans-serif; font-size: 11px; padding: 12px;">
      <p>CHER AMI,</p>
      <p>Je suis le Prince Abubakar III, unique h\u00e9ritier du Royaume du
         D\u00e9veloppement Web Nig\u00e9rian. Je dispose de 15\u00a0000\u00a0000\u00a0$ (QUINZE MILLIONS
         DE DOLLARS AM\u00c9RICAINS) en \u00e9toiles GitHub que je dois transf\u00e9rer
         \u00e0 un d\u00e9veloppeur de confiance.</p>
      <p>Tout ce dont j\u2019ai besoin\u00a0:</p>
      <ul>
        <li>Votre expertise full stack</li>
        <li>Un (1) npm install</li>
        <li>Votre nom d\u2019utilisateur GitHub pour un transfert imm\u00e9diat d\u2019\u00e9toiles</li>
      </ul>
      <p>Veuillez r\u00e9pondre DE TOUTE URGENCE car cette offre expire quand
         node_modules aura fini de s\u2019installer.</p>
      <p>Vos promesses en attente,<br /><b>Prince Abubakar III</b><br />
         <em>Licence Informatique (Universit\u00e9 de Lagos)<br />
         Master Ing\u00e9nierie Avanc\u00e9e 419</em></p>
    </div>
  `,
  'email.sentReply.subject': 'RE\u00a0: Votre portfolio',
  'email.sentReply.body': `
    <div style="font-family: Tahoma, sans-serif; font-size: 11px; padding: 12px;">
      <p>Bill,</p>
      <p>Merci infiniment\u00a0! Venant de vous, \u00e7a repr\u00e9sente \u00e9norm\u00e9ment.
         J\u2019ai pass\u00e9 bien trop d\u2019heures \u00e0 peaufiner ces d\u00e9grad\u00e9s au pixel pr\u00e8s.</p>
      <p>Si vous voulez un jour collaborer sur une recr\u00e9ation de Windows ME,
         vous savez o\u00f9 me trouver. 😄</p>
      <p>Cordialement,<br /><b>Alexandre</b></p>
    </div>
  `,
  'email.deletedImportant.subject': 'RE\u00a0: Important \u2014 NE PAS SUPPRIMER',
  'email.deletedImportant.body': `
    <div style="font-family: Tahoma, sans-serif; font-size: 11px; padding: 12px;">
      <p style="color: red; font-weight: bold;">⚠️ R\u00c9CUP\u00c9R\u00c9 DE LA CORBEILLE ⚠️</p>
      <p>Cet e-mail \u00e9tait marqu\u00e9 comme important et n\u2019aurait pas d\u00fb \u00eatre supprim\u00e9.</p>
      <p>Contenu du message original\u00a0:</p>
      <div style="background: #f5f5f5; padding: 12px; border-left: 3px solid #ccc; margin: 8px 0;">
        <p><code>sudo rm -rf /node_modules</code></p>
        <p>Je plaisante. Ne faites jamais \u00e7a.</p>
        <p>En fait, faites-le tous les jours. \u00c7a forge le caract\u00e8re.</p>
      </div>
    </div>
  `,
  'email.draftTodo.subject': 'TODO\u00a0: finir cet e-mail',
  'email.draftTodo.body': `
    <div style="font-family: Tahoma, sans-serif; font-size: 11px; padding: 12px;">
      <p>Cher [DESTINATAIRE],</p>
      <p>Je voulais vous contacter au sujet de</p>
      <p style="color: #999;"><em>[ ...c\u2019est l\u00e0 que je me suis laiss\u00e9 distraire par
         un bug CSS et que je ne suis jamais revenu... ]</em></p>
      <p style="color: #999;"><em>\u00c0 faire\u00a0:</em></p>
      <ul style="color: #999;">
        <li><em>Finir cet e-mail</em></li>
        <li><em>Corriger le bug CSS</em></li>
        <li><em>Prendre l\u2019air</em></li>
        <li><em>Se rappeler de quoi parlait cet e-mail</em></li>
      </ul>
    </div>
  `,

  // ── Compose ─────────────────────────────────────────────────────────────────
  'compose.send': 'Envoyer',
  'compose.cut': 'Couper',
  'compose.paste': 'Coller',
  'compose.check': 'V\u00e9rifier',
  'compose.to': '\u00c0\u00a0:',
  'compose.from': 'De\u00a0:',
  'compose.email': 'Email\u00a0:',
  'compose.subject': 'Objet\u00a0:',
  'compose.placeholder.name': 'Votre nom',
  'compose.placeholder.email': 'votre@email.com',
  'compose.placeholder.subject': 'Objet',
  'compose.placeholder.message': '\u00c9crivez votre message ici...',
  'compose.validation.name': 'Veuillez saisir votre nom.',
  'compose.validation.email': 'Veuillez saisir votre adresse e-mail.',
  'compose.validation.emailInvalid': 'Veuillez saisir une adresse e-mail valide.',
  'compose.validation.subject': 'Veuillez saisir un objet.',
  'compose.validation.message': 'Veuillez saisir un message.',
  'compose.validation.nameTooLong': 'Le nom est trop long (80 caract\u00e8res max).',
  'compose.validation.subjectTooLong': 'L\u2019objet est trop long (120 caract\u00e8res max).',
  'compose.validation.messageTooLong': 'Le message est trop long (4000 caract\u00e8res max).',
  'compose.status.sent': 'Votre message a \u00e9t\u00e9 envoy\u00e9\u00a0!',
  'compose.status.sending': 'Envoi du message...',
  'compose.status.error': '\u00c9chec de l\u2019envoi. Veuillez r\u00e9essayer.',
  'compose.status.networkError': 'Erreur r\u00e9seau. Veuillez r\u00e9essayer.',

  // -- Adobe Reader --
  'reader.download': 'Enregistrer une copie',
  'reader.print': 'Imprimer',
  'reader.fitPage': 'Ajuster à la page',
  'reader.fitWidth': 'Ajuster à la largeur',
  'reader.zoomIn': 'Zoom avant',
  'reader.zoomOut': 'Zoom arrière',
  'reader.previousPage': 'Page précédente',
  'reader.nextPage': 'Page suivante',
  'reader.pageLabelLimit': 'de {0}',
  'reader.about.description':
    'Un lecteur PDF fa\u00e7on Adobe Reader, int\u00e9gr\u00e9 \u00e0 ce portfolio. ' +
    'Source sur [GitHub](https://github.com/AlexandreVig/alexvig.dev).',
  'reader.about.footer': 'Con\u00e7u avec Astro, TypeScript et PDF.js.',

  // ── Minesweeper ───────────────────────────────────────────────────────────────
  'minesweeper.about.description':
    'Une recr\u00e9ation de D\u00e9mineur fa\u00e7on Windows XP, int\u00e9gr\u00e9e \u00e0 ce portfolio. ' +
    'Source sur [GitHub](https://github.com/AlexandreVig/alexvig.dev).',
  'minesweeper.about.footer': 'Con\u00e7u avec Astro et TypeScript.',
};

export default fr;
