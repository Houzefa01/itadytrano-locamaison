## 1) Objectif du site

Créer une plateforme web de mise en relation entre :

* **les bailleurs** qui publient des maisons à louer ;
* **les étudiants / locataires** qui cherchent un logement proche de leur école, faculté ou université.

Le système doit permettre de **rechercher, comparer, visiter, réserver et louer** un logement de manière simple, rapide et sécurisée.

---

## 2) Rôles des utilisateurs

### A. Visiteur anonyme

Utilisateur sans compte.

**Fonctionnalités :**

* Voir l’actualité générale du site.
* Consulter les publications des bailleurs.
* Lire les commentaires et les avis.
* Rechercher les logements disponibles.
* Voir les détails publics d’une maison.
* Cliquer sur “Réserver” ou “Contacter”, mais dans ce cas le site demande :

  * de créer un compte, ou
  * de se connecter.

**Limites :**

* Ne peut pas réserver.
* Ne peut pas payer.
* Ne peut pas envoyer de message privé.
* Ne peut pas commenter sans compte.

---

### B. Étudiant / Locataire

Utilisateur qui cherche une maison à louer.

**Inscription :**

* Nom
* Prénom
* Email facultatif
* Numéro de téléphone
* École / faculté / université
* Date de naissance
* Mot de passe

**Fonctionnalités :**

* Avoir un tableau de bord complet.
* Voir un fil d’actualités des logements publiés par les bailleurs.
* Filtrer les logements par :

  * proximité de l’école/faculté ;
  * prix ;
  * disponibilité de l’eau ;
  * disponibilité de l’électricité ;
  * nombre de chambres ;
  * présence de WC/douche ;
  * type de logement ;
  * distance ou localisation.
* Aimer / ne pas aimer une publication.
* Mettre une publication en favori.
* Consulter la localisation sur carte.
* Demander une visite à une date précise.
* Réserver une maison disponible.
* Payer :

  * une avance de réservation ;
  * la caution au début du contrat ;
  * le loyer mensuel.
* Recevoir des notifications liées au paiement, à la visite et à la réservation.
* Envoyer des messages privés au bailleur ou à d’autres étudiants.
* Laisser un commentaire ou un avis sur une publication.
* Consulter l’historique :

  * des recherches ;
  * des favoris ;
  * des visites ;
  * des réservations ;
  * des paiements ;
  * des messages.

**Limites :**

* Ne peut pas publier une maison.
* Ne peut pas modifier une annonce de bailleur.

---

### C. Bailleur

Utilisateur qui publie des maisons à louer.

**Inscription :**

* Nom
* Prénom
* Email facultatif
* Numéro de téléphone
* Adresse
* Compte bancaire ou moyen de réception de paiement facultatif
* Mot de passe

**Fonctionnalités :**

* Avoir un tableau de bord des revenus.
* Publier des maisons à louer.
* Modifier, désactiver ou supprimer ses annonces.
* Gérer la disponibilité d’une maison :

  * disponible ;
  * réservée ;
  * occupée ;
  * indisponible temporairement.
* Répondre aux commentaires.
* Répondre aux messages privés.
* Voir les demandes de visite.
* Accepter ou refuser une réservation.
* Suivre l’historique :

  * des publications ;
  * des réservations ;
  * des visites ;
  * des paiements ;
  * des messages.
* Envoyer des messages privés à des étudiants ou à d’autres bailleurs.
* Recevoir des alertes en cas de :

  * réservation ;
  * visite demandée ;
  * paiement reçu ;
  * retard de paiement.

---

### D. Administrateur

Utilisateur qui supervise la plateforme.

**Fonctionnalités :**

* Gérer les comptes utilisateurs.
* Ajouter, modifier ou supprimer les écoles / facultés / universités et leurs emplacements.
* Supprimer une publication frauduleuse ou abusive.
* Suspendre ou supprimer un compte.
* Voir les publications et comptes signalés.
* Gérer les signalements.
* Modérer les commentaires et messages abusifs.
* Suivre l’activité générale de la plateforme.
* Gérer les catégories et paramètres du site.

---

## 3) Fiche d’une maison à louer

Chaque annonce doit contenir au minimum :

* Titre de l’annonce
* Localisation exacte sur carte
* Quartier / adresse
* Distance par rapport à l’école ou faculté
* Prix du loyer
* Montant de la caution
* Montant de l’avance
* Disponibilité de l’électricité : oui / non
* Disponibilité de l’eau : oui / non, ou distance si approvisionnement externe
* Présence de WC
* Présence de douche
* Nombre de chambres
* Nombre d’occupants possibles
* Description détaillée
* Plusieurs photos
* Vidéo facultative
* Statut du logement :

  * disponible ;
  * réservé ;
  * occupé.
* Nom du bailleur
* Contact du bailleur
* Historique de disponibilité

---

## 4) Réservation et paiement

La logique doit être claire :

### Réservation

* Le locataire choisit une maison disponible.
* Il demande une réservation.
* Il paie une avance.
* La réservation devient valide après confirmation.
* Une date limite peut être calculée selon la règle définie par l’administrateur ou le bailleur.

### Paiement

* Paiement de l’avance.
* Paiement de la caution.
* Paiement mensuel du loyer.
* Historique complet des transactions.

### Notifications automatiques

* Confirmation après paiement.
* Rappel avant échéance du loyer.
* Notification au bailleur lorsqu’un paiement est effectué.
* Notification au bailleur lorsqu’une visite est demandée.
* Notification au bailleur lorsqu’une réservation est faite.
* Alerte si un locataire est en retard de paiement.

---

## 5) Messagerie et interaction

* Messagerie privée entre :

  * locataire et bailleur ;
  * locataire et locataire ;
  * bailleur et bailleur.
* Commentaires publics sur les annonces.
* Réponses aux commentaires.
* Système de favoris.
* Système de réactions :

  * j’aime ;
  * je n’aime pas.

---

## 6) Notifications et vérification

Le site doit intégrer :

* Vérification du numéro de téléphone.
* Vérification de l’email.
* Envoi automatique de SMS.
* Envoi automatique d’emails.
* Notifications de :

  * réservation ;
  * paiement ;
  * visite ;
  * rappel de loyer ;
  * retard de paiement ;
  * validation de compte.

---

## 7) Historique

Chaque utilisateur doit pouvoir consulter son historique.

### Étudiant / locataire

* Publications consultées
* Favoris
* Réservations
* Visites
* Paiements
* Messages

### Bailleur

* Annonces publiées
* Réservations reçues
* Visites demandées
* Paiements reçus
* Messages
* Revenus

---

## 8) Règles et conditions d’utilisation

* Respect des lois malgaches en vigueur.
* Interdiction de publier des annonces frauduleuses.
* Interdiction de faux comptes.
* Interdiction de contenus offensants ou trompeurs.
* Protection des données personnelles.
* Validation des informations importantes avant publication.
* Possibilité de signaler un compte ou une annonce.

---

## 9) Fonctionnalités importantes que tu n’avais pas encore mises mais qu’il faut prévoir

Voici ce qui manque souvent dans ce type de projet, et qu’il vaut mieux ajouter :

* Système de recherche avancée.
* Carte interactive.
* Gestion des disponibilités par calendrier.
* Système de signalement.
* Authentification sécurisée.
* Récupération de mot de passe.
* Gestion des rôles et permissions.
* Tableau de bord séparé pour chaque rôle.
* Notifications en temps réel.
* Gestion des fichiers de preuve si besoin.
* Protection contre les abus et faux avis.
* Statut de vérification des bailleurs.
* Statut de vérification des annonces.
* Statistiques sur les logements les plus vus, les plus réservés, les plus appréciés.

---

## 10) Version très propre du résumé du projet

**Plateforme web de location de maisons pour étudiants**, permettant aux bailleurs de publier leurs logements et aux étudiants de rechercher, filtrer, visiter, réserver et louer une maison proche de leur établissement, avec paiement, messagerie privée, notifications automatiques, avis, favoris et gestion administrative.

