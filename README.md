# Proforma – Bill-Metz Auto Garage

Petit logiciel web pour créer des factures proforma et les imprimer / enregistrer en PDF (format A4).

**Utilisation**
1. Remplir le client, le véhicule et les articles (QTÉ, description, prix unité) — les montants et totaux se calculent seuls.
2. *Enregistrer* garde la proforma dans le navigateur (liste « Proformas enregistrées »).
3. *Imprimer / PDF* → choisir « Enregistrer au format PDF », format **A4**, et cocher **Graphiques d'arrière-plan** pour garder l'en-tête vert.

**Logo** : placer l'image d'en-tête dans le dépôt sous le nom `logo.png`, ou l'importer depuis *Entreprise & logo*.

Les données restent dans le navigateur de l'ordinateur utilisé. Utiliser *Exporter* pour faire une sauvegarde.

**Hors connexion** : après une première ouverture avec internet, le site est gardé sur l'appareil et fonctionne sans réseau (création, enregistrement, PDF, impression). On peut aussi l'installer comme une application (« Ajouter à l'écran d'accueil » / « Installer »).
Lors d'une modification du site, changer `VERSION` dans `sw.js` pour que les appareils récupèrent la nouvelle version.
