import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Logement, AmenityCode, LOGEMENT_TYPE_LABELS, AMENITY_LABELS, AMENITY_ICONS } from '../../../core/models';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { PrixAriaryPipe } from '../../pipes/prix-ariary.pipe';

@Component({
  selector: 'app-logement-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, PrixAriaryPipe],
  template: `
  <a [routerLink]="[baseLink, logement.id]"
     class="it-card overflow-hidden block group transition-all duration-200 hover:-translate-y-1.5 hover:shadow-card-lg focus-visible:-translate-y-1.5"
     [attr.aria-label]="logement.titre + ' à ' + logement.quartier + ', ' + (logement.prix | prixAriary) + ' par mois'">

    <!-- Visuel -->
    <div class="relative aspect-[4/3] bg-surface-container overflow-hidden">
      @if (photo()) {
        <img [src]="photo() | imageUrl" [alt]="'Photo de ' + logement.titre"
             class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
             [class.grayscale]="!logement.disponible" [class.opacity-80]="!logement.disponible" loading="lazy">
      } @else {
        <div class="w-full h-full grid place-items-center bg-gradient-to-br from-primary-container via-surface-container to-secondary-container/30">
          <span class="material-symbols-outlined text-6xl text-primary/30" aria-hidden="true">apartment</span>
        </div>
      }
      <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent pointer-events-none"></div>

      <div class="absolute top-3 left-3 flex items-center gap-1.5">
        @if (!logement.disponible) {
          <span class="it-badge bg-black/70 text-white backdrop-blur inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px]" aria-hidden="true">lock</span>Occupé
          </span>
        }
        <span class="it-badge bg-surface/90 text-on-surface backdrop-blur">{{ TYPE[logement.type] }}</span>
        @if (logement.noteMoyenne) {
          <span class="it-badge bg-surface/90 text-on-surface backdrop-blur inline-flex items-center gap-0.5">
            <span class="material-symbols-outlined text-[13px] text-amber-500 fill-1" aria-hidden="true">star</span>{{ logement.noteMoyenne }}
          </span>
        }
      </div>

      <button (click)="toggle($event)" type="button" [attr.aria-pressed]="favori"
              [attr.aria-label]="favori ? 'Retirer des favoris' : 'Ajouter aux favoris'"
              class="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-surface/90 backdrop-blur grid place-items-center shadow-card hover:scale-110 active:scale-95 transition-transform">
        <span class="material-symbols-outlined text-[20px]" [class.fill-1]="favori"
              [class.text-tertiary]="favori" [class.text-on-surface-variant]="!favori" aria-hidden="true">favorite</span>
      </button>

      <p class="absolute bottom-2.5 left-3 right-3 flex items-center gap-1 text-white text-xs font-medium drop-shadow">
        <span class="material-symbols-outlined text-[15px]" aria-hidden="true">location_on</span>
        <span class="truncate">{{ logement.quartier }}</span>
      </p>
    </div>

    <!-- Infos -->
    <div class="p-4">
      <h3 class="font-bold text-on-surface line-clamp-1 mb-2">{{ logement.titre }}</h3>

      <div class="flex items-center gap-3 text-on-surface-variant mb-3 text-[13px]">
        <span class="inline-flex items-center gap-1" title="Capacité d'accueil">
          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">group</span>{{ logement.nbrMaxPersonne }}
          <span class="sr-only">personnes</span>
        </span>
        @for (a of amenities(); track a) {
          <span class="inline-flex items-center" [title]="LABEL[a]">
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">{{ ICON[a] }}</span>
            <span class="sr-only">{{ LABEL[a] }}</span>
          </span>
        }
      </div>

      <div class="flex items-end justify-between pt-3 border-t border-outline-variant/40">
        <p class="flex items-baseline gap-1">
          <span class="font-display text-lg font-extrabold text-primary">{{ logement.prix | prixAriary }}</span>
          <span class="text-xs text-on-surface-variant">/ mois</span>
        </p>
        <span class="inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" aria-hidden="true">
          Voir <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </span>
      </div>
    </div>
  </a>
  `,
})
export class LogementCard {
  @Input({ required: true }) logement!: Logement;
  @Input() favori = false;
  @Input() baseLink = '/logements';
  @Output() favorisChange = new EventEmitter<number>();

  readonly TYPE = LOGEMENT_TYPE_LABELS;
  readonly LABEL = AMENITY_LABELS;
  readonly ICON = AMENITY_ICONS;

  photo(): string | undefined {
    const p = this.logement.photos;
    return p?.find(x => x.principale)?.url ?? p?.[0]?.url;
  }

  amenities(): AmenityCode[] { return (this.logement.amenities ?? []).slice(0, 3); }

  toggle(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.favorisChange.emit(this.logement.id);
  }
}
