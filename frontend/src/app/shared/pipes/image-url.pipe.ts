import { Pipe, PipeTransform, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
environment
@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  private readonly baseApiUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

  transform(url: string | undefined | null, placeholder: string = 'assets/digokira_icon_512.png'): string {
    if (!url) {
      return placeholder;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${this.baseApiUrl}${url}`;
    }

    return `${this.baseApiUrl}/${url}`;
  }
}
