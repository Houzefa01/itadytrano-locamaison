// ─────────────────────────────────────────────────────────────────────────────
// src/app/core/models/index.ts
// Modèles TypeScript — LocaMaison
// Alignés sur le MCD + MPD PostgreSQL + Backend Java Spring Boot
// ─────────────────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════
// ENUMS — alignés @JsonValue Java
// ═══════════════════════════════════════════════════════════════════════════

// ── Rôles utilisateur ─────────────────────────────────────────────────────────
export enum UserRole {
  ETUDIANT     = 'ETUDIANT',
  PROPRIETAIRE = 'PROPRIETAIRE',
  ADMIN        = 'ADMIN'
}

export enum UserStatus {
  PENDING   = 'PENDING',
  ACTIVE    = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED   = 'DELETED'
}

// ── Type de logement (LogementType.java : STUDIO, CHAMBRE, MAISON, APPARTEMENT)
export enum LogementType {
  STUDIO      = 'STUDIO',
  CHAMBRE     = 'CHAMBRE',
  MAISON      = 'MAISON',
  APPARTEMENT = 'APPARTEMENT'
}

// ── Statut de logement (LogementStatut.java : BROUILLON, EN_ATTENTE, PUBLIE, REJETE)
export enum LogementStatut {
  BROUILLON    = 'BROUILLON',
  EN_ATTENTE   = 'EN_ATTENTE',
  PUBLIE       = 'PUBLIE',
  REJETE       = 'REJETE',
  INDISPONIBLE = 'INDISPONIBLE'
}

// ── Équipements (AmenityCode.java — @JsonValue = code minuscule)
export enum AmenityCode {
  EAU             = 'eau',
  ELECTRICITE     = 'electricite',
  WC              = 'wc',
  DOUCHE          = 'douche',
  PRES_DE_ROUTE   = 'pres_de_route',
  AVOIR_COUR      = 'avoir_cour',
  FACTURE_INCLUSE = 'facture_incluse',
  MEUBLE          = 'meuble',
  SECURITE        = 'securite'
}

// ── Réservation
export enum ReservationStatut {
  EN_ATTENTE                     = 'en_attente',
  VISITE_PLANIFIEE               = 'visite_planifiee',
  ATTENTE_PAIEMENT               = 'attente_paiement',
  EN_ATTENTE_VALIDATION_PROPRIO  = 'en_attente_validation_proprio',
  LOGEMENT_RESERVE               = 'logement_reserve',
  ANNULE                         = 'annule',
  ANNULE_REFUSE                  = 'annule_refuse'
}

export enum TypeReservation {
  VISITE = 'VISITE',
  DIRECTE = 'DIRECTE'
}

// ── Paiement
export enum TypePaiement {
  LOYER_MENSUEL      = 'loyer_mensuel',
  DEPOT_GARANTIE     = 'depot_garantie',
  ACOMPTE_RESERVATION = 'acompte_reservation',
  FRAIS_VISITE       = 'frais_visite'
}

export enum ModePaiement {
  MOBILE_MONEY = 'mobile_money',
  VIREMENT     = 'virement',
  ESPECES      = 'especes',
  CARTE        = 'carte'
}

export enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  SEQUESTRE  = 'SEQUESTRE',
  VALIDE     = 'VALIDE',
  REFUSE     = 'REFUSE',
  REMBOURSE  = 'REMBOURSE'
}

// ── Contrat
export enum StatutContrat {
  ACTIF    = 'actif',
  TERMINE  = 'termine',
  RESILIE  = 'resilie'
}

export enum TypeContrat {
  BAIL_ETUDIANT = 'bail_etudiant',
  BAIL_MOBILITE = 'bail_mobilite',
  BAIL_STANDARD = 'bail_standard'
}


// ═══════════════════════════════════════════════════════════════════════════
// LABELS UI — Inter + Material Symbols
// ═══════════════════════════════════════════════════════════════════════════

export const LOGEMENT_TYPE_LABELS: Record<LogementType, string> = {
  [LogementType.STUDIO]:      'Studio',
  [LogementType.CHAMBRE]:     'Chambre',
  [LogementType.MAISON]:      'Maison',
  [LogementType.APPARTEMENT]: 'Appartement'
};

/** Noms des icônes Material Symbols Outlined */
export const LOGEMENT_TYPE_ICONS: Record<LogementType, string> = {
  [LogementType.STUDIO]:      'meeting_room',
  [LogementType.CHAMBRE]:     'bed',
  [LogementType.MAISON]:      'house',
  [LogementType.APPARTEMENT]: 'apartment'
};

export const LOGEMENT_STATUT_LABELS: Record<LogementStatut, string> = {
  [LogementStatut.BROUILLON]:    'Brouillon',
  [LogementStatut.EN_ATTENTE]:   'En attente',
  [LogementStatut.PUBLIE]:       'Publié',
  [LogementStatut.REJETE]:       'Rejeté',
  [LogementStatut.INDISPONIBLE]: 'Indisponible'
};

export const LOGEMENT_STATUT_ICONS: Record<LogementStatut, string> = {
  [LogementStatut.BROUILLON]:    'draft',
  [LogementStatut.EN_ATTENTE]:   'schedule',
  [LogementStatut.PUBLIE]:       'check_circle',
  [LogementStatut.REJETE]:       'cancel',
  [LogementStatut.INDISPONIBLE]: 'block'
};

export const AMENITY_LABELS: Record<AmenityCode, string> = {
  [AmenityCode.EAU]:             'Eau courante',
  [AmenityCode.ELECTRICITE]:     'Électricité',
  [AmenityCode.WC]:              'WC',
  [AmenityCode.DOUCHE]:          'Douche',
  [AmenityCode.PRES_DE_ROUTE]:   'Près de la route',
  [AmenityCode.AVOIR_COUR]:      'Cour disponible',
  [AmenityCode.FACTURE_INCLUSE]: 'Factures incluses',
  [AmenityCode.MEUBLE]:          'Meublé',
  [AmenityCode.SECURITE]:        'Sécurité'
};

/** Noms des icônes Material Symbols Outlined */
export const AMENITY_ICONS: Record<AmenityCode, string> = {
  [AmenityCode.EAU]:             'water_drop',
  [AmenityCode.ELECTRICITE]:     'bolt',
  [AmenityCode.WC]:              'wc',
  [AmenityCode.DOUCHE]:          'shower',
  [AmenityCode.PRES_DE_ROUTE]:   'add_road',
  [AmenityCode.AVOIR_COUR]:      'yard',
  [AmenityCode.FACTURE_INCLUSE]: 'receipt_long',
  [AmenityCode.MEUBLE]:          'chair',
  [AmenityCode.SECURITE]:        'security'
};


// ═══════════════════════════════════════════════════════════════════════════
// ENTITÉS PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════

// ── Utilisateur ──────────────────────────────────────────────────────────────
export interface Utilisateur {
  id:         number;           // Long Java → number
  nom:        string;
  prenom:     string;
  telephone:  string;           // identifiant de connexion (obligatoire, unique)
  email?:     string;           // facultatif
  role:       UserRole;
  status:     UserStatus;
  avatarUrl?: string;
  verifie:    boolean;
  createdAt:  string;           // ISO 8601 depuis l'API REST
  updatedAt:  string;
}

// ── Localisation GPS ─────────────────────────────────────────────────────────
export interface Localisation {
  id:                number;
  logementId:        number;
  latitude:          number;
  longitude:         number;
  adresseComplete?:  string;
  ville:             string;
  codePostal?:       string;
  distanceCampusKm?: number;    // calculé automatiquement (trigger Haversine)
  lienGoogleMaps?:   string;
  updatedAt:         string;
}

// ── Logement ─────────────────────────────────────────────────────────────────
export interface Logement {
  id:             number;       // Long Java → number
  proprietaireId: number;
  proprietaire?:  Utilisateur;

  // Informations générales
  titre:          string;
  description:    string;
  prix:           number;       // BigDecimal Java → number (Ariary MGA)
  type:           LogementType;
  adresse:        string;
  quartier:       string;

  // Disponibilité & capacité
  disponible:     boolean;
  nbrMaxPersonne: number;
  amenities?:     AmenityCode[]; // Set<AmenityCode> Java → enum typé

  // Conditions financières
  caution?:       number;
  avance?:        number;
  modesPaiement?: ModePaiement[]; // modes acceptés par le propriétaire

  // Localisation
  localisation?:  Localisation;

  // Médias & agrégats (@Formula Java — lecture seule)
  photos?:               Photo[];
  readonly noteMoyenne?:   number;
  readonly nombreAvis?:    number;
  readonly nombreFavoris?: number;
  readonly vues?:          number; // compteur de vues uniques

  // Modération
  statut:    LogementStatut;
  createdAt: string;
  updatedAt: string;
}

// ── Photo ────────────────────────────────────────────────────────────────────
export interface Photo {
  id:         number;
  logementId: number;
  url:        string;
  principale: boolean;
  ordre:      number;
  createdAt:  string;
}

// ── Favoris ──────────────────────────────────────────────────────────────────
export interface Favori {
  id:         number;
  etudiantId: number;
  logementId: number;
  logement?:  Logement;
  createdAt:  string;
}

// ── Message ──────────────────────────────────────────────────────────────────
export interface Message {
  id:             number;
  expediteurId:   number;
  expediteur?:    Utilisateur;
  destinataireId: number;
  destinataire?:  Utilisateur;
  logementId?:    number;
  logement?:      Logement;
  contenu?:       string;
  attachmentUrl?: string;
  lu:             boolean;
  createdAt:      string;
}

// ── Réservation ───────────────────────────────────────────────────────────────
export interface Reservation {
  id:         number;
  etudiantId: number;
  etudiant?:  Utilisateur;
  logementId: number;
  logement?:  Logement;
  dateVisite: string;
  heureVisite?: string;
  statut:     ReservationStatut;
  typeReservation: TypeReservation;
  montantTotal?: number;
  montantPaye?: number;
  dateExpiration?: string;
  confirmeParEtudiant: boolean;
  confirmeParProprietaire: boolean;
  visiteConfirmee: boolean;
  createdAt:  string;
}

// ── Avis ─────────────────────────────────────────────────────────────────────
export interface Avis {
  id:          number;
  etudiantId:  number;
  etudiant?:   Utilisateur;
  logementId:  number;
  note:        number;         // 1 à 5
  commentaire: string;
  createdAt:   string;
}

// ── Paiement ─────────────────────────────────────────────────────────────────
export interface Paiement {
  id:                     number;
  etudiantId:             number;
  etudiant?:              Utilisateur;
  logementId:             number;
  logement?:              Logement;
  reservationId?:         number;

  montant:                number;        // Ariary
  typePaiement:           TypePaiement;
  mode:                   ModePaiement;
  statut:                 StatutPaiement;

  referenceTransaction?:  string;
  preuveUrl?:             string;

  datePaiement:           string;
  periodeDebut?:          string;
  periodeFin?:            string;

  createdAt:              string;
}

export interface PaiementResponse {
  id: number;
  montant: number;
  statut: StatutPaiement;
  referenceTransaction: string;
  datePaiement: string;
  typePaiement: TypePaiement;
  mode: ModePaiement;
  logementTitre?: string;
  logementId?: number;
  reservationId?: number;
  etudiant?: {                 // expéditeur (locataire)
    id: number;
    nom: string;
    prenom: string;
    telephone?: string;
    avatarUrl?: string;
  };
  bailleur?: {                 // destinataire (propriétaire)
    id: number;
    nom: string;
    prenom: string;
    telephone?: string;
    avatarUrl?: string;
  };
  periodeDebut?: string;
  periodeFin?: string;
  createdAt: string;
}

// ── Échéancier de loyer ──────────────────────────────────────────────────────
export interface Echeance {
  mois: string;        // yyyy-MM
  libelle: string;     // ex. "juillet 2026"
  periode: string;     // date ISO du 1er du mois
  montant: number;
  paye: boolean;
  statut?: StatutPaiement | null;
}

// ── Contrat ──────────────────────────────────────────────────────────────────
export interface Contrat {
  id:            number;
  etudiantId:    number;
  etudiant?:     Utilisateur;
  logementId:    number;
  logement?:     Logement;

  dateDebut:     string;
  dateFin?:      string;
  loyerMensuel:  number;       // Ariary
  depotGarantie: number;       // Ariary
  clauses?:      string;
  statut:        StatutContrat;
  documentUrl?:  string;

  createdAt:     string;
}

export interface ContratResponse {
  id: number;
  etudiantId: number;
  etudiantNom: string;
  logementId: number;
  logementTitre: string;
  dateDebut: string;
  dateFin?: string;
  dureeMois?: number;
  loyerMensuel: number;
  chargesMensuelles: number;
  depotGarantie: number;
  typeContrat: TypeContrat;
  clauses?: string;
  lieuSignature?: string;
  templateName?: string;
  statut: StatutContrat;
  documentUrl?: string;
  createdAt: string;
}


// ═══════════════════════════════════════════════════════════════════════════
// DTOs — REQUÊTES & RÉPONSES API
// ═══════════════════════════════════════════════════════════════════════════

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  telephone: string;            // connexion par numéro de téléphone
  password:  string;
}

export interface RegisterRequest {
  nom:        string;
  prenom:     string;
  telephone:  string;           // obligatoire
  email?:     string;           // facultatif
  password:   string;
  role:       UserRole;
  ecoleId?:   number | null;
  adresse?:   string;
  moyenPaiement?: string;
}

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  user:         Utilisateur;
}

// ── Filtres recherche logement ────────────────────────────────────────────────
export interface LogementFilters {
  quartier?:     string;
  prixMin?:      number;
  prixMax?:      number;
  type?:         LogementType;
  distanceMax?:  number;        // km
  amenities?:    AmenityCode[]; // typé enum
  nbrPersonnes?: number;
  statut?:       LogementStatut;
}

// ── Pagination générique ──────────────────────────────────────────────────────
export interface PagedResult<T> {
  data:     T[];
  total:    number;
  page:     number;
  pageSize: number;
}

// ── Création / modification logement ─────────────────────────────────────────
export interface CreateLogementRequest {
  titre:          string;
  description:    string;
  prix:           number;
  type:           LogementType;
  adresse:        string;
  quartier:       string;
  nbrMaxPersonne: number;
  amenities?:     AmenityCode[]; // typé enum
  caution?:       number;
  avance?:        number;
  modesPaiement?: ModePaiement[]; // modes acceptés par le propriétaire
  latitude?:      number;
  longitude?:     number;
}

export type UpdateLogementRequest = Partial<CreateLogementRequest>;

export interface ReservationRequest {
  logementId: number;
  dateVisite: string; // ISO date string YYYY-MM-DD
}

// ── Création paiement ─────────────────────────────────────────────────────────
export interface CreatePaiementRequest {
  logementId:            number;
  reservationId?:        number;
  montant:               number;
  typePaiement:          TypePaiement;
  mode:                  ModePaiement;
  datePaiement:          string;
  periodeDebut?:         string;
  periodeFin?:           string;
  referenceTransaction?: string;
}

export interface LandlordStatsResponse {
  totalViews: number;
  inquiriesCount: number;
  activeListingsCount: number;
  pendingListingsCount: number;
  totalListingsCount: number;
  pendingReservationsCount: number;
}

// ── Utilisateurs intéressés par un logement ──────────────────────────────────
export interface InterestedUser {
  id:         number;
  nom:        string;
  prenom:     string;
  avatarUrl?: string;
  type:       'PROPRIETAIRE' | 'ETUDIANT_FAVORI' | 'ETUDIANT_RESERVE';
}
