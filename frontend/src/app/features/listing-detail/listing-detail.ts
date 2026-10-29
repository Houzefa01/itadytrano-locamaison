import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LogementService } from '../../core/services/logement.service';
import { ReservationService } from '../../core/services/reservation.service';
import { PaiementService } from '../../core/services/paiement.service';
import { AvisService } from '../../core/services/avis.service';
import { ReactionService } from '../../core/services/reaction.service';
import { SignalementService } from '../../core/services/signalement.service';
import { AuthService } from '../../core/services/auth.service';
import { EtablissementService, Etablissement } from '../../core/services/etablissement.service';
import { DistanceService, DistanceResult } from '../../core/services/distance.service';
import { CreneauService, Creneau } from '../../core/services/creneau.service';
import { ToastService } from '../../core/services/toast.service';
import { DialogService } from '../../core/services/dialog.service';
import { Logement, TypeReservation, TypePaiement, ModePaiement, AMENITY_LABELS, AMENITY_ICONS, LOGEMENT_TYPE_LABELS } from '../../core/models';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { PrixAriaryPipe } from '../../shared/pipes/prix-ariary.pipe';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ImageUrlPipe, PrixAriaryPipe],
  template: `
  @if (loading) {
    <div class="it-page py-8 grid lg:grid-cols-[1fr_360px] gap-8">
      <div class="it-skel h-[420px]"></div><div class="it-skel h-72"></div>
    </div>
  } @else if (l) {
    <div class="it-page py-6">
      <a routerLink="/logements" class="it-btn-ghost mb-4 !px-2"><span class="material-symbols-outlined">arrow_back</span> Retour</a>

      <!-- Galerie : toutes les photos de l'annonce -->
      <div class="mb-8">
        @if (mainPhoto(); as cover) {
          <div class="aspect-[16/9] rounded-2xl overflow-hidden bg-surface-container">
            <img [src]="cover | imageUrl" [alt]="l.titre" class="w-full h-full object-cover">
          </div>
          @if ((l.photos ?? []).length > 1) {
            <div class="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              @for (p of l.photos ?? []; track p.id) {
                <button type="button"
                        class="aspect-video rounded-xl overflow-hidden bg-surface-container ring-2 transition"
                        [class.ring-primary]="cover === p.url"
                        [class.ring-transparent]="cover !== p.url"
                        (click)="main.set(p.url)">
                  <img [src]="p.url | imageUrl" [alt]="l.titre"
                       class="w-full h-full object-cover hover:scale-105 transition-transform">
                </button>
              }
            </div>
            <p class="text-xs text-on-surface-variant mt-2">{{ (l.photos ?? []).length }} photo(s)</p>
          }
        } @else {
          <div class="aspect-[21/9] rounded-2xl grid place-items-center bg-gradient-to-br from-primary-container via-surface-container to-secondary-container/30">
            <span class="material-symbols-outlined text-7xl text-primary/30" aria-hidden="true">apartment</span>
          </div>
        }
      </div>

      <div class="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <!-- Colonne principale -->
        <div class="space-y-8">
          <div>
            <span class="it-badge bg-primary-container text-on-primary-container mb-2">{{ TYPE[l.type] }}</span>
            <h1 class="font-display text-3xl font-extrabold">{{ l.titre }}</h1>
            <p class="text-on-surface-variant flex items-center gap-1 mt-1"><span class="material-symbols-outlined text-[18px]">location_on</span>{{ l.adresse }}, {{ l.quartier }}</p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-on-surface-variant">
              @if (l.createdAt) {
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">schedule</span>Publié le {{ l.createdAt | date:'short' }}</span>
              }
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">visibility</span>{{ l.vues ?? 0 }} vue{{ (l.vues ?? 0) > 1 ? 's' : '' }}</span>
            </div>
          </div>

          <!-- Caractéristiques -->
          <div class="flex flex-wrap gap-3">
            <div class="it-chip"><span class="material-symbols-outlined text-[18px]">group</span> {{ l.nbrMaxPersonne }} pers.</div>
            @for (a of l.amenities ?? []; track a) {
              <div class="it-chip"><span class="material-symbols-outlined text-[18px]">{{ ICON[a] }}</span> {{ LABEL[a] }}</div>
            }
          </div>

          <div>
            <h2 class="font-display text-xl font-bold mb-2">Description</h2>
            <p class="text-on-surface-variant whitespace-pre-line leading-relaxed">{{ l.description }}</p>
          </div>

          <!-- Carte -->
          @if (l.localisation?.latitude) {
            <div>
              <h2 class="font-display text-xl font-bold mb-2">Localisation</h2>
              <div id="it-detail-map" class="w-full h-80 rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container"></div>
            </div>
          }

          <!-- Avis & réactions -->
          <div class="border-t border-outline-variant/40 pt-6">
            <div class="flex items-center gap-3 mb-4">
              <button (click)="react('LIKE')" class="it-btn-outline" [class.!border-primary]="reactions().maReaction==='LIKE'">
                <span class="material-symbols-outlined">thumb_up</span> {{ reactions().likes }}
              </button>
              <button (click)="react('DISLIKE')" class="it-btn-outline" [class.!border-error]="reactions().maReaction==='DISLIKE'">
                <span class="material-symbols-outlined">thumb_down</span> {{ reactions().dislikes }}
              </button>
              <button (click)="signaler()" class="it-btn-ghost ml-auto text-on-surface-variant hover:!text-error"><span class="material-symbols-outlined">flag</span> Signaler</button>
            </div>

            <h2 class="font-display text-xl font-bold mb-3">Avis &amp; commentaires</h2>
            <div class="it-card p-4 mb-4">
              <div class="flex items-center gap-1 mb-2">
                <span class="text-sm font-medium text-on-surface-variant mr-2">Note (option) :</span>
                @for (n of [1,2,3,4,5]; track n) {
                  <button (click)="newNote = newNote===n ? null : n" class="material-symbols-outlined"
                          [class.text-amber-500]="!!newNote && n<=newNote" [class.text-outline-variant]="!newNote || n>newNote"
                          [class.fill-1]="!!newNote && n<=newNote">star</button>
                }
              </div>
              <textarea [(ngModel)]="newComment" rows="2" class="it-field" placeholder="Partagez votre avis ou une question…"></textarea>
              <button (click)="submitAvis()" [disabled]="!newComment.trim()" class="it-btn-primary mt-2 disabled:opacity-50">Publier</button>
            </div>

            <div class="space-y-3">
              @for (a of topAvis(); track a.id) {
                <div class="it-card p-4">
                  <div class="flex items-center justify-between">
                    <span class="font-bold">{{ a.etudiant?.prenom }} {{ a.etudiant?.nom }}</span>
                    @if (a.note) {
                      <span class="text-amber-500 text-sm whitespace-nowrap">
                        @for (s of [1,2,3,4,5]; track s) { <span class="material-symbols-outlined text-[15px]" [class.opacity-20]="s>a.note" style="font-variation-settings:'FILL' 1">star</span> }
                      </span>
                    }
                  </div>
                  <p class="text-on-surface-variant text-sm mt-1">{{ a.commentaire }}</p>
                  @for (r of repliesOf(a.id); track r.id) {
                    <div class="ml-5 mt-2 pl-3 border-l-2 border-outline-variant/50">
                      <span class="font-bold text-sm">{{ r.etudiant?.prenom }} {{ r.etudiant?.nom }}</span>
                      <p class="text-on-surface-variant text-sm">{{ r.commentaire }}</p>
                    </div>
                  }
                </div>
              } @empty { <p class="text-on-surface-variant text-sm italic">Aucun avis pour le moment.</p> }
            </div>
          </div>
        </div>

        <!-- Carte de réservation -->
        <aside class="it-card p-6 lg:sticky lg:top-20">
          <div class="flex items-baseline gap-1 mb-1">
            <span class="font-display text-3xl font-extrabold text-primary">{{ l.prix | prixAriary }}</span>
            <span class="text-on-surface-variant">/ mois</span>
          </div>
          <p class="text-sm text-on-surface-variant mb-1 flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">savings</span>
            @if (l.caution) { Caution : <b class="text-on-surface">{{ l.caution | prixAriary }}</b> } @else { Sans caution }
          </p>
          @if (l.noteMoyenne) { <p class="text-sm text-on-surface-variant mb-4"><span class="material-symbols-outlined text-[15px] text-amber-500" style="font-variation-settings:'FILL' 1">star</span> {{ l.noteMoyenne }} ({{ l.nombreAvis }} avis)</p> }

          <!-- Contacter le propriétaire (message privé) — masqué sur sa propre annonce -->
          @if (!estMonAnnonce) {
            <button (click)="contacterProprietaire()" class="it-btn-outline w-full mb-3">
              <span class="material-symbols-outlined">chat</span> Contacter le propriétaire
            </button>
          }

          @if (peutReserver) {
          <!-- Créneaux de visite proposés par le propriétaire -->
          @if (creneaux.length) {
            <div class="mb-3 p-3 rounded-xl bg-surface-container/60 border border-outline-variant/40">
              <label class="it-label flex items-center gap-1"><span class="material-symbols-outlined text-[18px] text-primary">event_available</span> Créneaux de visite proposés</label>
              <p class="text-xs text-on-surface-variant mb-2">Les visites ne sont possibles que dans ces plages. Choisissez-en une :</p>
              <div class="flex flex-wrap gap-2">
                @for (c of creneaux; track c.id) {
                  <button (click)="pickCreneau(c)" class="it-chip it-chip-btn"
                          [class.bg-primary]="creneauChoisi?.id===c.id" [class.text-on-primary]="creneauChoisi?.id===c.id">
                    <span class="material-symbols-outlined text-[15px]">calendar_month</span>
                    {{ c.dateCreneau | date:'d MMM' }}@if (c.dateFin && c.dateFin !== c.dateCreneau) {<span>–{{ c.dateFin | date:'d MMM' }}</span>}@if (c.heureDebut) {<span class="opacity-80"> · {{ c.heureDebut }}@if (c.heureFin) {<span>–{{ c.heureFin }}</span>}</span>}
                  </button>
                }
              </div>
            </div>
          }

          <!-- VISITE : gratuite -->
          <label class="it-label mt-2">Date de visite souhaitée</label>
          <input [(ngModel)]="visiteDate" (ngModelChange)="onVisiteDateChange()" type="date" [min]="visiteMin" [max]="visiteMax" class="it-field mb-2">
          <label class="it-label">Heure de visite</label>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <select [(ngModel)]="visiteH" (ngModelChange)="normalizeHeure()" class="it-field" aria-label="Heure" [disabled]="!heuresDispo.length">
              @for (h of heuresDispo; track h) { <option [value]="h">{{ h }} h</option> }
            </select>
            <select [(ngModel)]="visiteM" class="it-field" aria-label="Minutes" [disabled]="!minutesDispo.length">
              @for (m of minutesDispo; track m) { <option [value]="m">{{ m }} min</option> }
            </select>
          </div>
          @if (creneaux.length && !heuresDispo.length) {
            <p class="text-xs text-error mb-2">Aucun horaire disponible pour cette date. Choisissez un créneau proposé ci-dessus.</p>
          }
          <button (click)="demanderVisite()" [disabled]="busy || !heuresDispo.length" class="it-btn-primary w-full mb-1 disabled:opacity-60"><span class="material-symbols-outlined">calendar_month</span> Demander une visite</button>
          <p class="text-xs text-on-surface-variant mb-3">La visite est gratuite et n'engage à rien.</p>

          <!-- RÉSERVATION : payante, bloque le logement -->
          <div class="pt-3 border-t border-outline-variant/40">
            @if (!showReserver) {
              <button (click)="ouvrirReservation()" [disabled]="!l.disponible || busy" class="it-btn-accent w-full disabled:opacity-60">
                <span class="material-symbols-outlined">event_available</span>
                {{ l.disponible ? 'Réserver ce logement' : 'Déjà réservé' }}
              </button>
            } @else {
              <p class="text-sm font-semibold mb-2">Acompte de réservation</p>
              <p class="text-xs text-on-surface-variant mb-2">L'acompte bloque le logement proportionnellement : 10% du loyer = 3 jours, 20% = 6 jours…</p>
              <div class="flex flex-wrap gap-2 mb-3">
                @for (p of pourcentages; track p) {
                  <button (click)="setPourcentage(p)" class="it-chip it-chip-btn"
                          [class.bg-primary]="pourcentage===p" [class.text-on-primary]="pourcentage===p">{{ p }}%</button>
                }
              </div>
              <div class="text-sm mb-3 space-y-1">
                <div class="flex justify-between"><span class="text-on-surface-variant">Acompte</span><b>{{ acompte | prixAriary }}</b></div>
                <div class="flex justify-between"><span class="text-on-surface-variant">Blocage estimé</span><b>{{ joursBloques }} jour(s)</b></div>
              </div>
              <label class="it-label">Mode de paiement</label>
              <select [(ngModel)]="modePaiement" class="it-field mb-3">
                @for (m of modesAcceptes(); track m) { <option [ngValue]="m">{{ MODE_LABEL[m] }}</option> }
              </select>
              <!-- Simulation : informations de paiement selon le moyen choisi -->
              @if (payMM) {
                <label class="it-label">Numéro Mobile Money</label>
                <input [(ngModel)]="payRef" type="tel" inputmode="tel" placeholder="ex. 034 12 345 67" class="it-field mb-3">
              } @else if (payVir) {
                <label class="it-label">Référence du virement / RIB</label>
                <input [(ngModel)]="payRef" placeholder="ex. MG46 00005 0123456789 12" class="it-field mb-3">
              }
              <button (click)="reserver()" [disabled]="busy || !modePaiement" class="it-btn-accent w-full mb-2 disabled:opacity-60">
                <span class="material-symbols-outlined">lock</span> Payer l'acompte et réserver
              </button>
              <button (click)="showReserver=false" class="it-btn-ghost w-full text-sm">Annuler</button>
            }
          </div>
          } @else {
            <p class="text-sm text-on-surface-variant mt-3 flex items-start gap-1.5 p-3 rounded-xl bg-surface-container/60"><span class="material-symbols-outlined text-[18px]">info</span> Les visites et réservations sont réservées aux comptes étudiants.</p>
          }
          @if (msg) { <p class="text-sm text-center mt-2" [class.text-primary]="!err" [class.text-error]="err">{{ msg }}</p> }

          <div class="mt-5 pt-5 border-t border-outline-variant/40">
            <label class="it-label">Itinéraire vers une école</label>
            <select [(ngModel)]="selectedEtab" (ngModelChange)="computeDistance()" class="it-field">
              <option [ngValue]="null">Choisir un établissement…</option>
              @for (e of etabs; track e.id) { <option [ngValue]="e.id">{{ e.nom }}</option> }
            </select>
            @if (selectedEtab) {
              <!-- Mode de déplacement -->
              <div class="grid grid-cols-3 gap-1.5 mt-3 p-1 bg-surface-container rounded-xl">
                @for (m of profils; track m.v) {
                  <button (click)="setProfil(m.v)" class="py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition"
                          [class.bg-surface-container-lowest]="routeProfile===m.v" [class.text-primary]="routeProfile===m.v"
                          [class.shadow-card]="routeProfile===m.v" [class.text-on-surface-variant]="routeProfile!==m.v">
                    <span class="material-symbols-outlined text-[18px]">{{ m.icon }}</span>{{ m.l }}
                  </button>
                }
              </div>
              @if (routeInfo) {
                <p class="mt-3 text-sm flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">{{ profilIcon() }}</span>
                  <b>{{ routeInfo.km }} km</b> · {{ routeInfo.min }} min
                  <span class="it-badge bg-surface-container text-on-surface-variant ml-auto">{{ profilLabel() }}</span>
                </p>
              } @else if (distance) {
                <p class="mt-3 text-sm flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">directions</span>
                  <b>{{ distance.distanceKm }} km</b> · {{ distance.dureeMinutes }} min
                </p>
              }
            }
          </div>

        </aside>
      </div>
    </div>
  } @else {
    <div class="it-page py-20 text-center text-on-surface-variant">Logement introuvable.</div>
  }
  `,
})
export class ListingDetail implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(LogementService);
  private reservSvc = inject(ReservationService);
  private paiementSvc = inject(PaiementService);
  private avisSvc = inject(AvisService);
  private reactionSvc = inject(ReactionService);
  private signalSvc = inject(SignalementService);
  private auth = inject(AuthService);
  private etabSvc = inject(EtablissementService);
  private distanceSvc = inject(DistanceService);
  private creneauSvc = inject(CreneauService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);
  private platformId = inject(PLATFORM_ID);
  private L: any; private map: any;
  private routeLayer: any; private etabMarker: any;
  routeProfile: 'foot' | 'driving' | 'bike' = 'driving';
  routeInfo: { km: number; min: number } | null = null;
  readonly profils = [
    { v: 'foot' as const, l: 'À pied', icon: 'directions_walk' },
    { v: 'driving' as const, l: 'Voiture', icon: 'directions_car' },
    { v: 'bike' as const, l: 'Vélo', icon: 'directions_bike' },
  ];

  etabs: Etablissement[] = [];
  selectedEtab: number | null = null;
  distance: DistanceResult | null = null;
  creneaux: Creneau[] = [];
  creneauChoisi: Creneau | null = null;

  /** Seuls les comptes étudiants (ou les visiteurs non connectés) peuvent demander
   *  une visite ou réserver. Un propriétaire (ou un admin) ne le peut pas. */
  get peutReserver(): boolean {
    return !this.auth.isProprietaire() && !this.auth.isAdmin();
  }

  /** Vrai si l'utilisateur connecté est le propriétaire de CETTE annonce.
   *  On masque alors « Contacter » (on ne se contacte pas soi-même) — mais un
   *  propriétaire peut contacter un AUTRE propriétaire sur une autre annonce. */
  get estMonAnnonce(): boolean {
    const uid = this.auth.currentUser()?.id;
    const oid = this.l?.proprietaire?.id ?? this.l?.proprietaireId;
    return !!uid && !!oid && uid === oid;
  }

  /** Bornes du sélecteur de date : limitées au créneau choisi, sinon à l'étendue des créneaux. */
  get visiteMin(): string {
    if (this.creneauChoisi) return this.maxDate(this.creneauChoisi.dateCreneau, this.today);
    if (this.creneaux.length) {
      const min = this.creneaux.map(c => c.dateCreneau).sort()[0];
      return this.maxDate(min, this.today);
    }
    return this.today;
  }
  get visiteMax(): string | null {
    if (this.creneauChoisi) return this.creneauChoisi.dateFin || this.creneauChoisi.dateCreneau;
    if (this.creneaux.length) return this.creneaux.map(c => c.dateFin || c.dateCreneau).sort().slice(-1)[0];
    return null;
  }
  private maxDate(a: string, b: string): string { return a > b ? a : b; }

  /** Créneaux disponibles couvrant la date sélectionnée (dates ISO comparées lexicographiquement). */
  private creneauxPourDate(d: string): Creneau[] {
    if (!d) return [];
    return this.creneaux.filter(c => d >= c.dateCreneau && d <= (c.dateFin || c.dateCreneau));
  }
  /** L'horaire (h:m) tombe-t-il dans la plage [heureDebut..heureFin] du créneau ? */
  private dansHoraire(c: Creneau, h: number, m: number): boolean {
    const [hd, md] = (c.heureDebut || '00:00').split(':').map(Number);
    const [hf, mf] = (c.heureFin || '23:59').split(':').map(Number);
    const t = h * 60 + m;
    return t >= hd * 60 + md && t <= hf * 60 + mf;
  }

  /** Heures sélectionnables : bornées aux créneaux de la date + heures passées exclues si c'est aujourd'hui. */
  get heuresDispo(): string[] {
    let hours: number[];
    if (!this.creneaux.length) {
      hours = this.heuresList.map(Number);
    } else {
      const set = new Set<number>();
      for (const c of this.creneauxPourDate(this.visiteDate)) {
        const hd = parseInt((c.heureDebut || '07').slice(0, 2), 10);
        const hf = parseInt((c.heureFin || '19').slice(0, 2), 10);
        for (let h = hd; h <= hf; h++) set.add(h);
      }
      hours = [...set].sort((a, b) => a - b);
    }
    if (this.visiteDate === this.today) {
      const nowH = new Date().getHours();
      hours = hours.filter(h => h >= nowH);
    }
    return hours.map(h => String(h).padStart(2, '0'));
  }
  /** Minutes sélectionnables pour l'heure choisie (bornes du créneau + minutes passées exclues). */
  get minutesDispo(): string[] {
    let mins = [...this.minutesList];
    const h = parseInt(this.visiteH || '-1', 10);
    if (this.creneaux.length) {
      const matching = this.creneauxPourDate(this.visiteDate);
      mins = mins.filter(m => matching.some(c => this.dansHoraire(c, h, parseInt(m, 10))));
    }
    if (this.visiteDate === this.today) {
      const now = new Date();
      if (h === now.getHours()) mins = mins.filter(m => parseInt(m, 10) > now.getMinutes());
    }
    return mins;
  }
  /** Réaligne heure/minute sur les valeurs encore autorisées. */
  normalizeHeure(): void {
    const hs = this.heuresDispo;
    if (!hs.includes(this.visiteH)) this.visiteH = hs[0] ?? '';
    const ms = this.minutesDispo;
    if (!ms.includes(this.visiteM)) this.visiteM = ms[0] ?? '';
  }
  /** Changement de date : re-cale le créneau choisi puis les heures/minutes valides. */
  onVisiteDateChange(): void {
    const couvrant = this.creneauxPourDate(this.visiteDate);
    if (couvrant.length && !couvrant.some(c => c.id === this.creneauChoisi?.id)) {
      this.creneauChoisi = couvrant[0];
    }
    this.normalizeHeure();
  }

  l?: Logement;
  loading = true;
  id!: number;
  main = signal<string | undefined>(undefined);
  reactions = signal<{ likes: number; dislikes: number; maReaction?: string }>({ likes: 0, dislikes: 0 });
  avis: any[] = [];
  newComment = ''; newNote: number | null = null;
  visiteDate = ''; today = new Date().toISOString().split('T')[0];
  // Heure de visite par sélection (heure + minutes), pas de saisie libre. Défaut : 07h00.
  visiteH = '07'; visiteM = '00';
  readonly heuresList = ['07','08','09','10','11','12','13','14','15','16','17','18','19'];
  readonly minutesList = ['00','15','30','45'];
  get visiteHeure(): string { return (this.visiteH && this.visiteM) ? `${this.visiteH}:${this.visiteM}` : ''; }
  busy = false; msg = ''; err = false;

  // Réservation payante (acompte)
  showReserver = false;
  pourcentages = [10, 20, 30, 50, 100];
  pourcentage = 10;
  modePaiement: ModePaiement | null = null;
  payRef = '';   // info de paiement saisie (n° Mobile Money / réf virement)
  get payMM(): boolean { return this.modePaiement === ModePaiement.MOBILE_MONEY; }
  get payVir(): boolean { return this.modePaiement === ModePaiement.VIREMENT; }
  readonly MODE_LABEL: Record<string, string> = {
    mobile_money: 'Mobile Money', virement: 'Virement bancaire', especes: 'Espèces', carte: 'Carte bancaire',
  };

  readonly TYPE = LOGEMENT_TYPE_LABELS;
  readonly LABEL = AMENITY_LABELS;
  readonly ICON = AMENITY_ICONS;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getLogement(this.id).subscribe({
      next: l => { this.l = l; this.loading = false; this.main.set(this.mainPhoto()); setTimeout(() => this.initMap(), 120); },
      error: () => { this.loading = false; },
    });
    this.reactionSvc.get(this.id).subscribe({ next: r => this.reactions.set(r), error: () => {} });
    this.avisSvc.getForLogement(this.id).subscribe({ next: a => this.avis = a, error: () => {} });
    this.etabSvc.list().subscribe({ next: e => this.etabs = e, error: () => {} });
    this.creneauSvc.list(this.id).subscribe({ next: c => { this.creneaux = c.filter(x => x.disponible); if (this.creneaux.length) { this.pickCreneau(this.creneaux[0]); } }, error: () => {} });
  }

  computeDistance(): void {
    if (!this.selectedEtab) { this.distance = null; this.clearItineraire(); return; }
    this.distanceSvc.between(this.id, this.selectedEtab).subscribe({
      next: d => this.distance = d,
      error: () => { this.distance = null; this.toast.info('Distance indisponible : coordonnées GPS manquantes pour ce logement ou cet établissement.'); },
    });
    const etab = this.etabs.find(e => e.id === this.selectedEtab);
    if (etab) this.drawItineraire(etab);
  }

  private clearItineraire(): void {
    if (this.map && this.routeLayer) { this.map.removeLayer(this.routeLayer); this.routeLayer = null; }
    if (this.map && this.etabMarker) { this.map.removeLayer(this.etabMarker); this.etabMarker = null; }
    this.routeInfo = null;
  }

  setProfil(p: 'foot' | 'driving' | 'bike'): void {
    this.routeProfile = p;
    const etab = this.etabs.find(e => e.id === this.selectedEtab);
    if (etab) this.drawItineraire(etab);
  }
  profilIcon(): string { return this.profils.find(p => p.v === this.routeProfile)?.icon ?? 'directions'; }
  profilLabel(): string { return this.profils.find(p => p.v === this.routeProfile)?.l ?? ''; }

  private homeMarkerIcon(): any {
    return this.L.divIcon({
      html: `<div style="position:relative;width:38px;height:46px">
        <div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#5B34D6;box-shadow:0 3px 8px rgba(0,0,0,.35);border:2px solid #fff"></div>
        <span class="material-symbols-outlined" style="position:absolute;top:6px;left:7px;color:#fff;font-size:24px">home</span></div>`,
      className: 'it-home-marker', iconSize: [38, 46], iconAnchor: [19, 44], popupAnchor: [0, -42],
    });
  }
  private etabMarkerIcon(): any {
    return this.L.divIcon({
      html: `<div style="position:relative;width:38px;height:46px">
        <div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#E8A317;box-shadow:0 3px 8px rgba(0,0,0,.35);border:2px solid #fff"></div>
        <span class="material-symbols-outlined" style="position:absolute;top:6px;left:7px;color:#fff;font-size:24px">school</span></div>`,
      className: 'it-etab-marker', iconSize: [38, 46], iconAnchor: [19, 44], popupAnchor: [0, -42],
    });
  }

  /** Trace l'itinéraire (OSRM) entre le logement et l'établissement, selon le mode choisi. */
  private async drawItineraire(etab: Etablissement): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.map || !this.L) return;
    const loc = this.l?.localisation;
    if (!loc?.latitude || !loc?.longitude || etab.latitude == null || etab.longitude == null) return;

    this.clearItineraire();
    this.routeInfo = null;
    this.etabMarker = this.L.marker([etab.latitude, etab.longitude], { icon: this.etabMarkerIcon() })
      .addTo(this.map).bindPopup(etab.nom);

    const a = `${loc.longitude},${loc.latitude}`;
    const b = `${etab.longitude},${etab.latitude}`;
    const straight = () => this.L.polyline(
      [[loc.latitude!, loc.longitude!], [etab.latitude!, etab.longitude!]],
      { color: '#5B34D6', weight: 3, dashArray: '6 8', opacity: 0.8 }).addTo(this.map);
    try {
      const url = `https://router.project-osrm.org/route/v1/${this.routeProfile}/${a};${b}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      const route = json?.routes?.[0];
      const coords: number[][] = route?.geometry?.coordinates ?? [];
      const latlngs = coords.map(c => [c[1], c[0]] as [number, number]);
      if (latlngs.length >= 2) {
        this.routeLayer = this.L.polyline(latlngs, { color: '#5B34D6', weight: 5, opacity: 0.85 }).addTo(this.map);
        if (route?.distance != null) {
          const km = route.distance / 1000;
          // Le serveur OSRM public ne fournit que la durée « voiture » : on calcule
          // une durée réaliste selon le mode (vitesses moyennes urbaines).
          const vitesse = this.routeProfile === 'foot' ? 5 : this.routeProfile === 'bike' ? 15 : 0;
          const min = vitesse > 0
            ? Math.max(1, Math.round((km / vitesse) * 60))
            : Math.max(1, Math.round((route.duration ?? (km / 30) * 3600) / 60));
          this.routeInfo = { km: Math.round(km * 10) / 10, min };
        }
      } else {
        this.routeLayer = straight();
      }
    } catch {
      this.routeLayer = straight();
    }
    try { this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] }); } catch { /* noop */ }
  }

  pickCreneau(c: Creneau): void {
    this.creneauChoisi = c;
    this.visiteDate = this.maxDate(c.dateCreneau, this.today); // début de l'intervalle (jamais dans le passé)
    const hm = (c.heureDebut || '07:00').slice(0, 5).split(':');
    this.visiteH = hm[0] || '07';
    this.visiteM = hm[1] || '00';
    this.normalizeHeure(); // exclut les heures/minutes déjà passées si le créneau démarre aujourd'hui
  }

  /** Ouvre une conversation privée avec le propriétaire de l'annonce. */
  contacterProprietaire(): void {
    if (!this.requireAuth()) return;
    const p = this.l?.proprietaire;
    if (!p?.id) { this.toast.info('Propriétaire indisponible.'); return; }
    const base = this.auth.isProprietaire() ? '/proprietaire' : this.auth.isAdmin() ? '/admin' : '/etudiant';
    this.router.navigate([base + '/messages'], {
      queryParams: { to: p.id, name: `${p.prenom ?? ''} ${p.nom ?? ''}`.trim(), logement: this.id },
    });
  }

  ngAfterViewInit(): void {}

  mainPhoto(): string | undefined {
    return this.main() ?? this.l?.photos?.find(p => p.principale)?.url ?? this.l?.photos?.[0]?.url;
  }

  private async initMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.l?.localisation?.latitude) return;
    this.L = await import('leaflet');
    const el = document.getElementById('it-detail-map'); if (!el) return;
    const { latitude, longitude } = this.l.localisation;
    this.map = this.L.map(el).setView([latitude, longitude], 16);
    const plan = this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 22, maxNativeZoom: 20, attribution: '© OpenStreetMap, © CARTO' });
    const satellite = this.L.layerGroup([
      this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 22, maxNativeZoom: 17, attribution: 'Imagery © Esri' }),
      this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', { maxZoom: 22, maxNativeZoom: 20 }),
    ]);
    plan.addTo(this.map);
    this.L.control.layers({ 'Plan': plan, 'Satellite': satellite }, {}, { position: 'topright' }).addTo(this.map);
    this.addCompass();
    this.L.marker([latitude, longitude], { icon: this.homeMarkerIcon() }).addTo(this.map).bindPopup(this.l.titre);
  }

  /** Boussole d'orientation (Nord). */
  private addCompass(): void {
    const ctrl = this.L.control({ position: 'topleft' });
    ctrl.onAdd = () => {
      const div = this.L.DomUtil.create('div', 'it-compass');
      div.innerHTML = `<div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.95);box-shadow:0 1px 6px rgba(0,0,0,.3);position:relative;display:grid;place-items:center" title="Nord">
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:15px solid #e53935;position:absolute;top:4px"></div>
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:15px solid #9e9e9e;position:absolute;bottom:5px"></div>
        <span style="position:absolute;top:1px;font-size:9px;font-weight:800;color:#e53935">N</span></div>`;
      return div;
    };
    ctrl.addTo(this.map);
  }

  topAvis(): any[] { return this.avis.filter(a => !a.parentId); }
  repliesOf(id: number): any[] { return this.avis.filter(a => a.parentId === id); }

  private requireAuth(): boolean {
    if (this.auth.getToken()) return true;
    this.router.navigate(['/auth/login']);
    return false;
  }

  react(type: 'LIKE' | 'DISLIKE'): void {
    if (!this.requireAuth()) return;
    this.reactionSvc.react(this.id, type).subscribe({ next: () => this.reactionSvc.get(this.id).subscribe(r => this.reactions.set(r)), error: () => this.toast.error('Action impossible.') });
  }

  submitAvis(): void {
    if (!this.requireAuth() || !this.newComment.trim()) return;
    this.avisSvc.create({ logementId: this.id, commentaire: this.newComment.trim(), note: this.newNote ?? undefined }).subscribe({
      next: () => { this.newComment = ''; this.newNote = null; this.toast.success('Avis publié.'); this.avisSvc.getForLogement(this.id).subscribe(a => this.avis = a); },
      error: (e) => this.toast.error(e?.error?.message ?? "Impossible de publier l'avis."),
    });
  }

  async signaler(): Promise<void> {
    if (!this.requireAuth()) return;
    const motif = await this.dialog.prompt('Signaler cette annonce', 'Expliquez brièvement le problème rencontré.', { placeholder: 'Motif du signalement…', confirmLabel: 'Envoyer' });
    if (!motif) return;
    this.signalSvc.signaler('LOGEMENT', this.id, motif).subscribe({ next: () => this.toast.success('Merci, signalement transmis.'), error: () => this.toast.error('Erreur lors du signalement.') });
  }

  demanderVisite(): void {
    if (!this.requireAuth()) return;
    if (!this.visiteDate) { this.err = true; this.msg = 'Choisissez une date de visite.'; return; }
    if (this.creneaux.length && !this.heuresDispo.includes(this.visiteH)) {
      this.err = true; this.msg = 'Choisissez une date et une heure dans un créneau proposé.'; return;
    }
    this.busy = true;
    this.reservSvc.createReservation({ logementId: this.id, dateVisite: this.visiteDate, heureVisite: this.visiteHeure || undefined, typeReservation: TypeReservation.VISITE }).subscribe({
      next: () => { this.busy = false; this.toast.success('Demande de visite envoyée.'); this.router.navigate(['/etudiant/reservations']); },
      error: (e) => { this.busy = false; this.err = true; this.msg = e?.error?.message ?? 'Réservation impossible.'; },
    });
  }

  // ── Réservation payante ────────────────────────────────────────────────────
  get acompte(): number { return Math.round(((this.l?.prix ?? 0) * this.pourcentage) / 100); }
  get joursBloques(): number {
    const loyer = this.l?.prix ?? 0;
    if (loyer <= 0) return 3;
    return Math.max(1, Math.min(Math.ceil((this.acompte / loyer) * 30), 30));
  }
  modesAcceptes(): ModePaiement[] {
    const m = this.l?.modesPaiement;
    return (m && m.length) ? m : [ModePaiement.MOBILE_MONEY, ModePaiement.VIREMENT, ModePaiement.ESPECES, ModePaiement.CARTE];
  }
  setPourcentage(p: number): void { this.pourcentage = p; }
  ouvrirReservation(): void {
    if (!this.requireAuth()) return;
    this.modePaiement = this.modesAcceptes()[0] ?? null;
    this.showReserver = true;
  }

  reserver(): void {
    if (!this.requireAuth() || !this.modePaiement) return;
    this.busy = true; this.msg = ''; this.err = false;
    const montant = this.acompte;
    // 1) Créer la réservation payante (le backend calcule le blocage et bloque le logement).
    this.reservSvc.createReservation({
      // Réservation directe : PAS d'heure de visite (concept propre aux visites) —
      // sinon l'heure par défaut (07:00) s'afficherait à tort côté propriétaire.
      logementId: this.id, dateVisite: this.visiteDate || this.today,
      typeReservation: TypeReservation.DIRECTE, montantPaye: montant,
    }).subscribe({
      next: (res: any) => {
        // 2) Enregistrer l'acompte comme paiement (mode choisi).
        this.paiementSvc.creerPaiement({
          logementId: this.id, reservationId: res?.id,
          montant, typePaiement: TypePaiement.ACOMPTE_RESERVATION,
          mode: this.modePaiement!, datePaiement: this.today,
          referenceTransaction: this.payRef.trim() || undefined,
        }).subscribe({
          next: () => { this.busy = false; this.toast.success('Demande de réservation envoyée. En attente de l\'acceptation du propriétaire.'); this.router.navigate(['/etudiant/reservations']); },
          // Réservation créée mais paiement KO : on informe sans bloquer.
          error: () => { this.busy = false; this.toast.info('Demande de réservation créée. Finalisez le paiement depuis vos réservations.'); this.router.navigate(['/etudiant/reservations']); },
        });
      },
      error: (e) => { this.busy = false; this.err = true; this.msg = e?.error?.message ?? e?.error?.error ?? 'Réservation impossible.'; },
    });
  }

  ngOnDestroy(): void { if (this.map) { this.map.off(); this.map.remove(); } }
}
