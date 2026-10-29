import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ContratResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  
  async generateContratPdf(contrat: ContratResponse): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header Style Based on Template
    const isStandard = contrat.templateName === 'Standard' || !contrat.templateName;
    const headerColor = isStandard ? [33, 150, 243] : [63, 81, 181]; // Blue vs Indigo
    
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const title = contrat.typeContrat === 'bail_etudiant' ? 'CONTRAT DE BAIL ÉTUDIANT' : 'CONTRAT DE BAIL D\'HABITATION';
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('LocaMaison - Votre partenaire logement à Madagascar', pageWidth / 2, 30, { align: 'center' });

    // Body
    doc.setTextColor(0, 0, 0);
    let y = 55;

    const addSection = (title: string, content: string[]) => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      content.forEach(line => {
        const splitText = doc.splitTextToSize(line, pageWidth - 40);
        doc.text(splitText, 20, y);
        y += (splitText.length * 5.5);
      });
      y += 4;
    };

    addSection('1. IDENTIFICATION DES PARTIES', [
      `LE BAILLEUR: Le propriétaire du bien immobilier "${contrat.logementTitre}".`,
      `LE LOCATAIRE: M./Mme ${contrat.etudiantNom}, occupant le bien à titre de résidence principale.`
    ]);

    addSection('2. DESCRIPTION DU LOGEMENT', [
      `Le présent bail concerne le logement situé à Antananarivo, référencé "${contrat.logementTitre}".`,
      `Le locataire déclare bien connaître les lieux pour les avoir visités.`
    ]);

    addSection('3. DURÉE ET PRISE D\'EFFET', [
      `Le contrat prend effet le: ${new Date(contrat.dateDebut).toLocaleDateString('fr-FR')}`,
      contrat.dureeMois ? `Durée convenue: ${contrat.dureeMois} mois.` : 'Le contrat est conclu pour une durée indéterminée.',
      contrat.dateFin ? `Date de fin prévue: ${new Date(contrat.dateFin).toLocaleDateString('fr-FR')}` : ''
    ].filter(l => l !== ''));

    addSection('4. CONDITIONS FINANCIÈRES', [
      `LOYER MENSUEL (Principal): ${contrat.loyerMensuel.toLocaleString()} Ar`,
      `CHARGES MENSUELLES: ${contrat.chargesMensuelles.toLocaleString()} Ar`,
      `TOTAL À PAYER CHAQUE MOIS: ${(contrat.loyerMensuel + (contrat.chargesMensuelles || 0)).toLocaleString()} Ar`,
      `DÉPÔT DE GARANTIE (CAUTION): ${contrat.depotGarantie.toLocaleString()} Ar (versé à l'entrée).`
    ]);

    if (contrat.clauses) {
      addSection('5. CLAUSES PARTICULIÈRES ET RÈGLEMENT', [contrat.clauses]);
    }

    addSection('6. SIGNATURES ET MENTION', [
      `Fait à ${contrat.lieuSignature || 'Antananarivo'}, le ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      'Lu et approuvé,                               Lu et approuvé,',
      'Le Propriétaire                               Le Locataire'
    ]);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`ID Transaction: ${contrat.id} | Document certifié par LocaMaison Digital Signature`, pageWidth / 2, 290, { align: 'center' });

    doc.save(`Contrat_${contrat.etudiantNom.replace(/\s+/g, '_')}_${contrat.id}.pdf`);
  }

  async generateRecuPdf(p: any): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(33, 150, 243); // Material Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('REÇU DE PAIEMENT', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('LocaMaison - Votre partenaire logement à Madagascar', pageWidth / 2, 30, { align: 'center' });

    // Body
    doc.setTextColor(0, 0, 0);
    let y = 60;

    const addLine = (label: string, value: string, boldValue = true) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`${label}:`, 30, y);
      if (boldValue) doc.setFont('helvetica', 'bold');
      doc.text(value, 80, y);
      y += 10;
    };

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU PAIEMENT', 30, y);
    y += 15;

    addLine('RÉFÉRENCE', p.referenceTransaction);
    addLine('DATE', new Date(p.datePaiement).toLocaleDateString('fr-FR'));
    addLine('ÉTUDIANT', `${p.etudiant?.prenom} ${p.etudiant?.nom}`);
    addLine('LOGEMENT', p.logementTitre || 'Non spécifié');
    addLine('TYPE', p.typePaiement.replace(/_/g, ' ').toUpperCase());
    addLine('MODE', p.mode.replace(/_/g, ' ').toUpperCase());
    
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(30, y, pageWidth - 30, y);
    y += 15;

    doc.setFontSize(14);
    doc.text('MONTANT TOTAL', 30, y);
    doc.setFontSize(18);
    doc.setTextColor(33, 150, 243);
    doc.text(`${p.montant.toLocaleString()} Ar`, pageWidth - 30, y, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    y += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Ce document est un reçu numérique généré automatiquement par la plateforme LocaMaison.', 30, y);
    doc.text('Il sert de preuve de paiement pour la transaction référencée ci-dessus.', 30, y + 5);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`ID Transaction: ${p.id} | Document certifié par LocaMaison Digital Signature`, pageWidth / 2, 285, { align: 'center' });

    doc.save(`Recu_Paiement_${p.referenceTransaction}.pdf`);
  }
}
