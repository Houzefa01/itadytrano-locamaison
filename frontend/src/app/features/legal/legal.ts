import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="it-page py-10 max-w-3xl">
    @if (type === 'confidentialite') {
      <h1 class="font-display text-3xl font-extrabold mb-6">Politique de confidentialité</h1>
      <div class="space-y-4 text-on-surface-variant leading-relaxed">
        <p><b class="text-on-surface">Données collectées.</b> LocaMaison collecte les données nécessaires au service : identité (nom, prénom), numéro de téléphone, email facultatif, logements, réservations et paiements.</p>
        <p><b class="text-on-surface">Finalités.</b> Création de compte, mise en relation locataire/bailleur, gestion des réservations, loyers et contrats, notifications.</p>
        <p><b class="text-on-surface">Conservation.</b> Vos données sont conservées le temps de l'utilisation du service. Les documents financiers (reçus, contrats) sont conservés pour répondre aux obligations légales.</p>
        <p><b class="text-on-surface">Vos droits.</b> Vous pouvez consulter et modifier vos informations depuis votre profil, et <b class="text-on-surface">supprimer votre compte</b> à tout moment (vos données personnelles sont alors anonymisées).</p>
        <p><b class="text-on-surface">Sécurité.</b> Mots de passe chiffrés (bcrypt), authentification par jeton, échanges protégés.</p>
        <p class="text-sm">Contact : support&#64;locamaison.mg</p>
      </div>
    } @else {
      <h1 class="font-display text-3xl font-extrabold mb-6">Conditions générales d'utilisation</h1>
      <div class="space-y-4 text-on-surface-variant leading-relaxed">
        <p><b class="text-on-surface">1. Objet.</b> LocaMaison est une plateforme de mise en relation entre étudiants locataires et propriétaires de logements à Madagascar.</p>
        <p><b class="text-on-surface">2. Compte.</b> L'inscription nécessite un numéro de téléphone valide vérifié par code. Vous êtes responsable de la confidentialité de vos identifiants.</p>
        <p><b class="text-on-surface">3. Réservation &amp; paiement.</b> La réservation d'un logement nécessite le versement d'un acompte qui bloque le bien proportionnellement. Le loyer se règle mensuellement ; un reçu est émis pour chaque paiement.</p>
        <p><b class="text-on-surface">4. Bail.</b> La location donne lieu à un contrat. Le bailleur ne peut pas mettre fin au bail tant que le locataire a réglé le loyer du mois en cours.</p>
        <p><b class="text-on-surface">5. Annonces.</b> Le propriétaire garantit l'exactitude de ses annonces. Tout contenu abusif peut être signalé et retiré.</p>
        <p><b class="text-on-surface">6. Responsabilité.</b> LocaMaison facilite la mise en relation mais n'est pas partie au contrat de location entre locataire et bailleur.</p>
        <p><b class="text-on-surface">7. Données personnelles.</b> Voir la <a href="/confidentialite" class="text-primary font-semibold">politique de confidentialité</a>.</p>
      </div>
    }
  </div>
  `,
})
export class Legal {
  private route = inject(ActivatedRoute);
  type = this.route.snapshot.data['type'] ?? 'cgu';
}
