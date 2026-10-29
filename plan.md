# Plan d'implémentation — LocaMaison

> Plan d'application de **tous** les besoins décrits dans [`besoin.md`](./besoin.md).
> Établi après analyse du cahier des charges **et** audit du code existant.
> **✅ ÉTAT (2026-06-22) : les 6 phases ont été IMPLÉMENTÉES côté backend et VÉRIFIÉES** (migrations Flyway V12→V22, endpoints testés au curl, suite de tests verte, smoke-test global 13/13). Couche **service Angular** ajoutée pour les nouvelles fonctionnalités. **Reste : les écrans UI frontend** (formulaires/boutons/pages) qui consomment ces APIs.

## Légende
- ✅ **Fait** — implémenté et fonctionnel
- 🟡 **Partiel** — partiellement présent, à compléter
- ❌ **À faire** — absent, à construire
- Effort : **S** (≤ 0,5 j) · **M** (0,5–2 j) · **L** (> 2 j)

---

## 0. Déjà réalisé (sessions précédentes)
Pour mémoire, ces points sont **acquis** et ne sont pas re-planifiés :
- Sécurité : secrets externalisés, secret JWT fort, endpoint SMS sécurisé, RBAC (`@PreAuthorize` + guards).
- Fiabilité : `GlobalExceptionHandler` (réponses 4xx/5xx JSON propres), `RuntimeException`→`ResourceNotFoundException`.
- Base de données : Flyway réparé (module `spring-boot-flyway`, V1→V11, `ddl-auto=validate`).
- Performance : **compression automatique des images à l'upload** (−94 % vérifié).
- UX : **skeletons** de chargement sur toutes les vues de données.
- Métier : **publication directe des annonces** (plus de validation admin obligatoire).
- Marque unifiée **LocaMaison**, JDK 17, hygiène git (`.gitattributes`/`.gitignore`).

---

## 1. État des lieux par besoin (traçabilité `besoin.md`)

### §2.A Visiteur anonyme
| Besoin | État | Note |
|---|---|---|
| Consulter publications / détails publics | ✅ | `GET /logements` public |
| Rechercher les logements | ✅ | filtres multicritères |
| Lire commentaires et avis | 🟡 | Avis ✅ ; commentaires publics ❌ |
| « Réserver/Contacter » → invite à se connecter | 🟡 | redirection login présente, à vérifier sur tous les CTA |
| Voir l'actualité générale du site | 🟡 | page d'accueil ✅, pas de fil d'actualité dédié |

### §2.B Étudiant / Locataire
| Besoin | État | Note |
|---|---|---|
| Inscription (nom, prénom, tél, mot de passe) | ✅ | |
| Inscription : **école/faculté/université** | ❌ | champ + entité établissement manquants |
| Inscription : **date de naissance** | ❌ | champ manquant |
| Tableau de bord étudiant | ✅ | |
| Filtres prix / type / distance / eau / élec / douche | ✅ | via `AmenityCode` (EAU, ELECTRICITE, DOUCHE…) |
| Filtres **nombre de chambres** / **WC** | ❌ | champs structurés absents |
| Filtre **proximité école** | ❌ | dépend de l'entité École (calcul distance) |
| Favoris | ✅ | |
| **Aimer / ne pas aimer** (réactions) | ❌ | aucun système de like/dislike |
| Carte (localisation) | ✅ | Leaflet |
| Demander une visite à une date | 🟡 | `TypeReservation.VISITE` + `dateVisite` ✅, workflow visite à clarifier |
| Réserver | ✅ | |
| Payer avance / caution / loyer | ✅ | `TypePaiement` |
| Notifications paiement/visite/réservation | 🟡 | temps réel WebSocket ✅, non historisées |
| Messagerie privée | ✅ | |
| Laisser un avis | ✅ | |
| Laisser un **commentaire** + réponses | ❌ | distinct des avis |
| Historique favoris/réservations/paiements/messages | ✅ | |
| Historique **des recherches** / **des visites** | ❌ | non journalisés |

### §2.C Bailleur
| Besoin | État | Note |
|---|---|---|
| Tableau de bord revenus | ✅ | `LandlordStatsResponse` |
| Publier / modifier / supprimer annonces | ✅ | |
| Inscription : **adresse**, **moyen de réception paiement** | ❌ | champs manquants |
| Gérer disponibilité (dispo/réservée/occupée/**indispo temporaire**) | 🟡 | `LogementStatut` à enrichir (pas d'« indisponible temporaire ») |
| Répondre commentaires / messages | 🟡 | messages ✅, réponses commentaires ❌ |
| Voir demandes de visite | 🟡 | via réservations type VISITE |
| Accepter / refuser réservation | ✅ | |
| Alertes réservation/visite/paiement reçu | 🟡 | temps réel ✅ |
| Alerte **retard de paiement** | ❌ | pas de tâche planifiée dédiée |
| Statut de **vérification du bailleur** | ❌ | |

### §2.D Administrateur
| Besoin | État | Note |
|---|---|---|
| Gérer les comptes (suspendre/supprimer) | ✅ | `UserStatus` SUSPENDED/DELETED |
| Supprimer publication frauduleuse | ✅ | modération (désormais optionnelle) |
| Gérer **écoles/facultés/universités** + emplacements | ❌ | entité absente |
| Voir publications/comptes **signalés** | ❌ | pas de signalement |
| **Gérer les signalements** | ❌ | |
| Modérer commentaires/messages abusifs | 🟡 | dépend des commentaires |
| Suivre l'activité / statistiques globales | 🟡 | dashboard admin partiel |
| Gérer catégories et paramètres du site | ❌ | |

### §3 Fiche d'une maison
| Champ requis | État |
|---|---|
| Titre, quartier/adresse, prix, description, photos, statut, bailleur, contact | ✅ |
| Localisation carte | ✅ (`Localisation`) |
| **Distance par rapport à l'école** | ❌ |
| **Caution** et **avance** sur l'annonce | ❌ (présents sur contrat/paiement, pas sur la fiche) |
| Électricité / Eau / Douche | ✅ (amenities) |
| Eau : **distance si approvisionnement externe** | 🟡 (booléen seulement) |
| **WC** (présence) | ❌ |
| **Nombre de chambres** | ❌ |
| Nombre d'occupants possibles | ✅ (`nbrMaxPersonne`) |
| **Vidéo facultative** | ❌ |
| **Historique de disponibilité** | ❌ |

### §4 Réservation & paiement
| Besoin | État |
|---|---|
| Demande de réservation, avance, validation, date limite | ✅ |
| Paiement avance/caution/loyer + historique | ✅ |
| Confirmation après paiement | ✅ |
| **Rappel avant échéance du loyer** | ❌ |
| Notif bailleur (paiement/visite/réservation) | ✅ |
| **Alerte retard de paiement** | ❌ |

### §5 Messagerie & interaction
| Besoin | État |
|---|---|
| Messagerie privée (locataire↔bailleur, etc.) | ✅ |
| **Commentaires publics + réponses** | ❌ |
| Favoris | ✅ |
| **Réactions j'aime / j'aime pas** | ❌ |

### §6 Notifications & vérification
| Besoin | État |
|---|---|
| Vérification téléphone (SMS) + email | ✅ |
| Envoi automatique SMS / email | ✅ |
| Notifications (réservation, paiement, visite, validation compte) | 🟡 temps réel, non historisées |
| **Rappel loyer / retard de paiement** | ❌ |

### §7 Historique
Favoris/réservations/paiements/messages ✅ — **recherches** et **visites** ❌.

### §8 Règles & CGU
Protection données 🟡, validation avant publication 🟡, **signalement** ❌, page CGU ❌.

### §9 Fonctionnalités « à prévoir »
Recherche avancée ✅ · Carte ✅ · **Calendrier de disponibilité** ❌ · **Signalement** ❌ · Auth sécurisée ✅ · **Récupération mot de passe** ❌ · Rôles/permissions ✅ · Dashboards par rôle ✅ · Notifs temps réel ✅ · Fichiers de preuve 🟡 (`preuveUrl`) · **Anti-faux-avis** ❌ · **Statut vérif. bailleur** ❌ · **Statut vérif. annonce** ✅ · **Statistiques (plus vus/réservés/appréciés)** 🟡.

---

## 2. Feuille de route priorisée

### 🟦 Phase 1 — Complétude des profils & sécurité du compte
| Tâche | Backend | Frontend | Effort |
|---|---|---|---|
| Champs étudiant : `ecoleId`/`dateNaissance` | migration + `Users` + `RegisterRequest` | form register étudiant | M |
| Champs bailleur : `adresse`, `moyenPaiement` | migration + `Users` | form register bailleur | S |
| **Récupération de mot de passe** (par email) | endpoints `forgot`/`reset` + token email ; **email rendu obligatoire** | écrans « mot de passe oublié / réinitialiser » | M |
| Statut de vérification bailleur | champ + logique admin | badge « bailleur vérifié » | S |

### 🟦 Phase 2 — Fiche logement complète & recherche par proximité
| Tâche | Backend | Frontend | Effort |
|---|---|---|---|
| Champs annonce : `nbChambres`, `wc` (bool), `caution`, `avance`, `videoUrl`, `eauDistance` | migration + `Logement` + DTO | formulaire addlisting + fiche détail | M |
| **Entité École/Université** (+ emplacement) | `Etablissement` + CRUD admin + migration | gestion admin établissements | M |
| Calcul **distance logement↔école** | **service de routage** (OSRM) : distance + temps réels, cache en base | affichage distance/temps + filtre proximité | M |
| Filtres chambres / WC | `FiltresLogement` + requête | UI filtres | S |
| Gestion disponibilité enrichie (indispo temporaire) | `LogementStatut` + endpoint | sélecteur statut | S |
| Historique de disponibilité | table `disponibilite_historique` | timeline fiche | M |

### 🟦 Phase 3 — Interactions sociales
| Tâche | Backend | Frontend | Effort |
|---|---|---|---|
| **Réactions j'aime / j'aime pas** | entité `Reaction` + endpoints + compteurs | boutons like/dislike | M |
| **Avis unifiés** (commentaire + note optionnelle + réponses) | refonte `Avis` : texte + note nullable + `parentId` (réponses) + endpoints | fil d'avis/réponses sur fiche | M |
| **Signalement** annonce/compte | entité `Signalement` + endpoints | bouton « signaler » | M |
| Modération commentaires/signalements | endpoints admin | console modération étendue | M |
| Anti-faux-avis (avis liés à une location réelle) | contrainte avis ↔ réservation/contrat | — | S |

### 🟦 Phase 4 — Notifications avancées
| Tâche | Backend | Frontend | Effort |
|---|---|---|---|
| **Entité `Notification`** persistée (+ lu/non-lu) | entité + endpoints + push existant | centre de notifications | M |
| **Rappel avant échéance loyer** | `@Scheduled` + email/SMS | — | M |
| **Alerte retard de paiement** | `@Scheduled` + alerte bailleur/étudiant | badge retard | M |
| Historique recherches & visites | tables `recherche`/`visite` ou journal | onglets historique | M |

### 🟦 Phase 5 — Admin, statistiques & calendrier
| Tâche | Backend | Frontend | Effort |
|---|---|---|---|
| Gestion signalements (file d'attente) | endpoints admin | écran signalements | M |
| Gestion établissements (CRUD complet) | CRUD `Etablissement` | écran admin | S |
| Paramètres du site / catégories | entité `Parametre` | écran réglages | M |
| **Statistiques globales** (plus vus/réservés/appréciés) | requêtes agrégées + `totalViews` réel | dashboards graphiques | M |
| **Calendrier de disponibilité** | créneaux datés **+ statut global** par logement | calendrier (visites/réservations par dates) | L |

### 🟦 Phase 6 — Qualité non-fonctionnelle
| Tâche | Détail | Effort |
|---|---|---|
| Performance < 500 ms | index DB (quartier, prix, statut, type) + mesure | M |
| **HTTPS** | reverse proxy + certificat (déploiement) | S (infra) |
| Tests automatisés | unitaires services + intégration endpoints clés | L |
| **Migration PDF → iText** (serveur) | générer contrats + reçus avec iText côté backend (remplace jsPDF) | M |
| Page **CGU / protection des données** | contenu légal (lois malgaches) | S |

---

## 3. Nouvelles entités à créer (synthèse)
`Etablissement` (école/fac/univ) · `Reaction` (j'aime/j'aime pas) · `Avis` **enrichi** (note optionnelle + réponses, fusion avis/commentaires) · `Signalement` · `Notification` · `DisponibiliteHistorique` · `Creneau` (calendrier) · (optionnel) `Recherche`, `Parametre`.
Chaque création s'accompagne d'une **migration Flyway** (V12, V13, …) — le schéma est en mode `validate`.

## 4. Décisions arrêtées ✅ (validées le 2026-06-21)
1. **PDF → iText** : génération PDF **côté serveur** (contrats + reçus), en remplacement de jsPDF (front). Conforme au cahier des charges.
2. **Distance école → service de routage** (OSRM / OpenRouteService) : distance **et temps de trajet réels** (pas seulement Haversine à vol d'oiseau).
3. **Récupération mot de passe → par email** (code/lien de réinitialisation). Conséquence : **l'email devient obligatoire** à l'inscription (la vérification SMS du téléphone reste en place).
4. **Avis & commentaires → fusionnés** : une seule notion « avis » = commentaire (texte) **avec note optionnelle** + **réponses** (fil). Une seule entité enrichie.
5. **Calendrier de disponibilité → créneaux par dates ET statut global** : le logement conserve un statut global (disponible/occupé…) **et** expose des créneaux datés (visites/réservations).

## 5. Ordre de mise en œuvre recommandé
**Phase 1 → 2 → 3 → 4 → 5 → 6.**
Les phases 1 et 2 débloquent le cœur métier (profils complets, fiche conforme, recherche par école). Les phases 3–4 ajoutent l'engagement (social + notifications). La phase 5 complète l'admin et le pilotage. La phase 6 consolide la qualité avant mise en production.
