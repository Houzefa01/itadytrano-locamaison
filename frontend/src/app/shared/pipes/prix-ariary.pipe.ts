import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prixAriary',
  standalone: true
})
export class PrixAriaryPipe implements PipeTransform {
  transform(value: number | string | undefined | null): string {
    if (value === null || value === undefined || value === '') {
      return 'Prix non renseigné';
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numericValue)) {
      return 'Prix invalide';
    }

    // Formatage : 450 000 Ar
    return new Intl.NumberFormat('fr-FR').format(numericValue) + ' Ar';
  }
}
