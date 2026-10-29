import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LogementService } from '../../../core/services/logement.service';
import { CreateLogementRequest, LogementType, LogementStatut, AmenityCode, ModePaiement, LOGEMENT_TYPE_LABELS, AMENITY_LABELS } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { MapPicker } from '../../../shared/components/map-picker/map-picker';

@Component({
  selector: 'app-add-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, MapPicker],
  template: `
  <div class="max-w-2xl">
    <h1 class="font-display text-2xl font-extrabold mb-6">{{ editing ? 'Modifier' : 'Publier' }} une annonce</h1>
    <div class="it-card p-6 space-y-4">
      <div><label class="it-label">Titre</label><input [(ngModel)]="f.titre" class="it-field" placeholder="Studio meublé proche UNA"></div>
      <div><label class="it-label">Description</label><textarea [(ngModel)]="f.description" rows="4" class="it-field" placeholder="Décrivez le logement…"></textarea></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="it-label">Prix (Ar/mois)</label><input [(ngModel)]="f.prix" type="number" class="it-field"></div>
        <div><label class="it-label">Type</label>
          <select [(ngModel)]="f.type" class="it-field">@for (t of types; track t.v) { <option [ngValue]="t.v">{{ t.l }}</option> }</select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="it-label">Adresse</label><input [(ngModel)]="f.adresse" class="it-field"></div>
        <div>
          <label class="it-label">Quartier</label>
          <input [(ngModel)]="f.quartier" list="quartiers-antsiranana" class="it-field" placeholder="Choisir ou saisir…">
          <datalist id="quartiers-antsiranana">
            @for (q of quartiers; track q) { <option [value]="q"></option> }
          </datalist>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="it-label">Capacité (personnes)</label><input [(ngModel)]="f.nbrMaxPersonne" type="number" min="1" class="it-field"></div>
        <div class="flex items-center gap-2 self-end pb-2.5">
          <input id="f-caution" [(ngModel)]="f.avecCaution" type="checkbox" class="w-4 h-4 accent-primary">
          <label for="f-caution" class="it-label !mb-0 cursor-pointer">Demander une caution <span class="text-on-surface-variant text-xs">(= 1 mois de loyer)</span></label>
        </div>
      </div>
      <div>
        <label class="it-label">Modes de paiement acceptés</label>
        <p class="text-xs text-on-surface-variant mb-1">Le locataire ne pourra payer qu'avec ces modes (aucun sélectionné = tous acceptés).</p>
        <div class="flex flex-wrap gap-2">
          @for (m of modes; track m.v) {
            <button (click)="toggleMode(m.v)" type="button" class="it-chip" [ngClass]="f.modesPaiement.includes(m.v) ? 'bg-primary text-on-primary' : ''">{{ m.l }}</button>
          }
        </div>
      </div>
      <div>
        <label class="it-label">Emplacement sur la carte</label>
        <app-map-picker [lat]="f.latitude" [lng]="f.longitude" (latChange)="f.latitude = $event" (lngChange)="f.longitude = $event" />
      </div>
      <div>
        <label class="it-label">Commodités</label>
        <div class="flex flex-wrap gap-2">
          @for (a of amenities; track a.v) {
            <button (click)="toggle(a.v)" type="button" class="it-chip" [ngClass]="f.amenities.includes(a.v) ? 'bg-primary text-on-primary' : ''">{{ a.l }}</button>
          }
        </div>
      </div>
      <div>
        <label class="it-label">Photos</label>
        <input type="file" multiple accept="image/*" (change)="onFiles($event)" class="it-field">
        <p class="text-xs text-on-surface-variant mt-1">La 1ʳᵉ photo est la <b>couverture</b> (affichée en premier sur l'annonce). Réorganisez l'ordre à votre guise.</p>
        @if (previews.length) {
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            @for (u of previews; track u; let i = $index) {
              <div class="relative group rounded-xl overflow-hidden border-2" [ngClass]="i===0 ? 'border-primary' : 'border-outline-variant/40'">
                <img [src]="u" class="w-full h-24 object-cover" alt="Photo {{ i + 1 }}">
                @if (i === 0) { <span class="absolute top-1 left-1 it-badge bg-primary text-on-primary !text-[10px] !py-0.5 !px-1.5">Couverture</span> }
                <div class="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button type="button" (click)="movePhoto(i,-1)" [disabled]="i===0" class="text-white p-1 disabled:opacity-30" aria-label="Reculer"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>
                  @if (i !== 0) { <button type="button" (click)="setFirst(i)" class="text-white p-1" aria-label="Mettre en couverture"><span class="material-symbols-outlined text-[18px]">star</span></button> }
                  <button type="button" (click)="removePhoto(i)" class="text-white p-1" aria-label="Retirer"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                  <button type="button" (click)="movePhoto(i,1)" [disabled]="i===previews.length-1" class="text-white p-1 disabled:opacity-30" aria-label="Avancer"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
                </div>
              </div>
            }
          </div>
          <p class="text-sm text-on-surface-variant mt-1">{{ previews.length }} photo(s)</p>
        }
      </div>

      @if (error) { <p class="text-error text-sm font-medium">{{ error }}</p> }
      <div class="flex gap-2">
        <button (click)="save()" [disabled]="saving" class="it-btn-primary disabled:opacity-60">{{ saving ? '…' : (editing ? 'Enregistrer' : 'Publier l\\'annonce') }}</button>
        <button (click)="router.navigate(['/proprietaire/logements'])" class="it-btn-outline">Annuler</button>
      </div>
    </div>
  </div>
  `,
})
export class AddListing implements OnInit {
  private svc = inject(LogementService);
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  id?: number;
  editing = false;
  saving = false;
  error = '';
  files: File[] = [];
  previews: string[] = [];   // URLs d'aperçu (object URLs), alignées avec files

  types = [
    { v: LogementType.STUDIO, l: LOGEMENT_TYPE_LABELS[LogementType.STUDIO] },
    { v: LogementType.CHAMBRE, l: LOGEMENT_TYPE_LABELS[LogementType.CHAMBRE] },
    { v: LogementType.APPARTEMENT, l: LOGEMENT_TYPE_LABELS[LogementType.APPARTEMENT] },
    { v: LogementType.MAISON, l: LOGEMENT_TYPE_LABELS[LogementType.MAISON] },
  ];
  amenities = (Object.keys(AMENITY_LABELS) as AmenityCode[]).map(v => ({ v, l: AMENITY_LABELS[v] }));
  modes = [
    { v: ModePaiement.MOBILE_MONEY, l: 'Mobile Money' }, { v: ModePaiement.VIREMENT, l: 'Virement' },
    { v: ModePaiement.ESPECES, l: 'Espèces' }, { v: ModePaiement.CARTE, l: 'Carte' },
  ];
  // Quartiers d'Antsiranana (Diego-Suarez) — suggestions, saisie libre possible.
  quartiers = [
    'Tanambao', 'Bazarikely', 'Lazaret Nord', 'Lazaret Sud', 'Ambalavola', 'Ankorikely',
    'Ankorrikika', 'Tsaramandroso', 'Place Kabary', 'Antsahabe', 'Mahatsara', 'Mangarivotra',
    'Morafeno', 'Scama', 'Grand Pavois', 'Antanamitarana', 'Ambalakirajy', 'Cap Diego',
    'Antsahampano', 'Tanambao V', 'Tanambao VI',
  ];

  f: any = { titre: '', description: '', prix: null, type: LogementType.STUDIO, adresse: '', quartier: '', nbrMaxPersonne: 1, avecCaution: false, amenities: [] as AmenityCode[], modesPaiement: [] as ModePaiement[], latitude: null, longitude: null };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam); this.editing = true;
      this.svc.getLogement(this.id).subscribe({
        next: l => this.f = { titre: l.titre, description: l.description, prix: l.prix, type: l.type, adresse: l.adresse, quartier: l.quartier, nbrMaxPersonne: l.nbrMaxPersonne, avecCaution: (l.caution ?? 0) > 0, amenities: l.amenities ?? [], modesPaiement: l.modesPaiement ?? [], latitude: l.localisation?.latitude ?? null, longitude: l.localisation?.longitude ?? null },
        error: () => {},
      });
    }
  }

  toggle(a: AmenityCode): void {
    const i = this.f.amenities.indexOf(a);
    i >= 0 ? this.f.amenities.splice(i, 1) : this.f.amenities.push(a);
  }
  toggleMode(m: ModePaiement): void {
    const i = this.f.modesPaiement.indexOf(m);
    i >= 0 ? this.f.modesPaiement.splice(i, 1) : this.f.modesPaiement.push(m);
  }
  onFiles(e: Event): void {
    const input = e.target as HTMLInputElement;
    for (const f of Array.from(input.files ?? [])) {
      this.files.push(f);
      this.previews.push(URL.createObjectURL(f));
    }
    input.value = ''; // permet de re-sélectionner les mêmes fichiers si besoin
  }
  /** Déplace une photo dans l'ordre (dir = -1 recule, +1 avance). L'index 0 = couverture. */
  movePhoto(i: number, dir: number): void {
    const j = i + dir;
    if (j < 0 || j >= this.files.length) return;
    [this.files[i], this.files[j]] = [this.files[j], this.files[i]];
    [this.previews[i], this.previews[j]] = [this.previews[j], this.previews[i]];
  }
  /** Met la photo i en couverture (position 0). */
  setFirst(i: number): void {
    if (i <= 0) return;
    this.files.unshift(this.files.splice(i, 1)[0]);
    this.previews.unshift(this.previews.splice(i, 1)[0]);
  }
  removePhoto(i: number): void {
    URL.revokeObjectURL(this.previews[i]);
    this.files.splice(i, 1);
    this.previews.splice(i, 1);
  }

  save(): void {
    this.error = '';
    if (!this.f.titre || !this.f.prix || !this.f.adresse) { this.error = 'Titre, prix et adresse sont requis.'; return; }
    if (!this.editing && this.files.length < 3) { this.error = 'Ajoutez au moins 3 photos pour publier une annonce.'; return; }
    const payload: CreateLogementRequest = {
      titre: this.f.titre, description: this.f.description || this.f.titre, prix: Number(this.f.prix), type: this.f.type,
      adresse: this.f.adresse, quartier: this.f.quartier || this.f.adresse, nbrMaxPersonne: Number(this.f.nbrMaxPersonne) || 1,
      caution: this.f.avecCaution ? Number(this.f.prix) : undefined,
      amenities: this.f.amenities,
      modesPaiement: this.f.modesPaiement?.length ? this.f.modesPaiement : undefined,
      latitude: this.f.latitude ?? undefined, longitude: this.f.longitude ?? undefined,
    };
    this.saving = true;
    if (this.editing && this.id) {
      this.svc.updateLogement(this.id, payload).subscribe({ next: () => this.afterUpdate(this.id!), error: e => this.fail(e) });
    } else {
      this.svc.createLogement(payload).subscribe({ next: l => this.afterCreate(l.id), error: e => this.fail(e) });
    }
  }

  private afterCreate(id: number): void {
    if (this.files.length) {
      const fd = new FormData();
      this.files.forEach(f => fd.append('photos', f));
      this.svc.uploadPhotos(id, fd).subscribe({
        next: () => this.publish(id),
        error: (e) => { this.error = "Échec de l'upload des photos."; this.saving = false; },
      });
    } else { this.publish(id); }
  }

  private publish(id: number): void {
    this.svc.updateStatut(id, LogementStatut.PUBLIE).subscribe({ next: () => this.done(), error: e => this.fail(e) });
  }

  private afterUpdate(id: number): void {
    if (this.files.length) {
      const fd = new FormData();
      this.files.forEach(f => fd.append('photos', f));
      this.svc.uploadPhotos(id, fd).subscribe({ next: () => this.done(), error: () => this.done() });
    } else { this.done(); }
  }
  private done(): void {
    this.saving = false;
    this.toast.success(this.editing ? 'Annonce mise à jour.' : 'Annonce publiée !');
    this.router.navigate(['/proprietaire/logements']);
  }
  private fail(e: any): void { this.saving = false; this.error = e?.error?.message ?? "Échec de l'enregistrement."; }
}
