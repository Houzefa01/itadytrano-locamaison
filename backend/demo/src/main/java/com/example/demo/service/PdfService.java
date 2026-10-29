package com.example.demo.service;

import com.example.demo.model.Contrat;
import com.example.demo.model.Paiement;
import com.example.demo.model.Users;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

/** Génération de documents PDF côté serveur (iText). */
@Service
public class PdfService {

    public byte[] genererContrat(Contrat c) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdf);

        Users bailleur = c.getLogement() != null ? c.getLogement().getProprietaire() : null;
        Users locataire = c.getEtudiant();

        doc.add(new Paragraph("LocaMaison").setBold().setFontSize(20).setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("CONTRAT DE BAIL D'HABITATION").setBold().setFontSize(15).setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("Référence : BAIL-" + c.getId()
                + "   ·   " + (c.getTypeContrat() != null ? c.getTypeContrat() : "BAIL_STUDIANT"))
                .setFontSize(9).setTextAlignment(TextAlignment.CENTER).setItalic());
        doc.add(new LineSeparator(new SolidLine()));

        doc.add(new Paragraph("\nENTRE LES SOUSSIGNÉS").setBold());
        doc.add(new Paragraph("Le Bailleur : " + nom(bailleur)
                + (bailleur != null && bailleur.getTelephone() != null ? "  (tél. " + bailleur.getTelephone() + ")" : "")));
        doc.add(new Paragraph("Le Locataire : " + nom(locataire)
                + (locataire != null && locataire.getTelephone() != null ? "  (tél. " + locataire.getTelephone() + ")" : "")));
        doc.add(new Paragraph("Ci-après dénommés respectivement « le Bailleur » et « le Locataire ».").setFontSize(9).setItalic());

        doc.add(new Paragraph("\nARTICLE 1 — DÉSIGNATION DU LOGEMENT").setBold());
        doc.add(new Paragraph("Bien loué : " + (c.getLogement() != null ? c.getLogement().getTitre() : "-")));
        doc.add(new Paragraph("Adresse : " + (c.getLogement() != null ? c.getLogement().getAdresse() : "-")
                + (c.getLogement() != null && c.getLogement().getQuartier() != null ? ", " + c.getLogement().getQuartier() : "")));

        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        doc.add(new Paragraph("\nARTICLE 2 — DURÉE").setBold());
        doc.add(new Paragraph("Le bail est consenti pour une durée de "
                + (c.getDureeMois() != null ? c.getDureeMois() + " mois" : "1 mois")
                + (c.getDateDebut() != null ? ", du " + c.getDateDebut().format(fmt)
                    + (c.getDateFin() != null ? " au " + c.getDateFin().format(fmt) : "") : "")
                + " (renouvelable). Chaque mois de location correspond à un mois calendaire."));

        int jourEcheance = c.getDateDebut() != null ? Math.min(c.getDateDebut().getDayOfMonth() + 5, 28) : 5;
        doc.add(new Paragraph("\nARTICLE 3 — CONDITIONS FINANCIÈRES").setBold());
        doc.add(new Paragraph("Loyer mensuel : " + c.getLoyerMensuel() + " Ar, payable d'avance au plus tard le " + jourEcheance + " de chaque mois.").setBold());
        doc.add(new Paragraph("Dépôt de garantie (caution) : " + c.getDepotGarantie() + " Ar, restitué en fin de bail déduction faite des éventuelles dégradations."));

        doc.add(new Paragraph("\nARTICLE 4 — CLAUSES PARTICULIÈRES").setBold());
        doc.add(new Paragraph(c.getClauses() != null && !c.getClauses().isBlank()
                ? c.getClauses()
                : "Le locataire s'engage à occuper paisiblement le logement et à régler son loyer mensuellement."));

        doc.add(new Paragraph("\n\nFait à " + (c.getLieuSignature() != null ? c.getLieuSignature() : "Antsiranana")
                + ", le " + java.time.LocalDate.now().format(fmt) + "."));
        doc.add(new Paragraph("\nSignature du Bailleur" + " ".repeat(30) + "Signature du Locataire").setFontSize(11));
        doc.add(new Paragraph("\n\nDocument généré automatiquement par LocaMaison (contrat n°" + c.getId() + ").")
                .setFontSize(8).setItalic().setTextAlignment(TextAlignment.CENTER));

        doc.close();
        return baos.toByteArray();
    }

    public byte[] genererRecu(Paiement p) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdf);

        doc.add(new Paragraph("LocaMaison").setBold().setFontSize(20).setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("REÇU DE PAIEMENT").setBold().setFontSize(16).setTextAlignment(TextAlignment.CENTER));
        doc.add(new LineSeparator(new SolidLine()));

        doc.add(new Paragraph("\nRéférence : " + p.getReferenceTransaction()));
        doc.add(new Paragraph("Date : " + p.getDatePaiement()));
        doc.add(new Paragraph("Locataire : " + nom(p.getEtudiant())));
        doc.add(new Paragraph("Logement : " + (p.getLogement() != null ? p.getLogement().getTitre() : "-")));
        doc.add(new Paragraph("Type : " + libelleType(p.getTypePaiement())));
        doc.add(new Paragraph("Mode : " + p.getMode()));
        doc.add(new Paragraph("Statut : " + libelleStatut(p.getStatut())));

        // Mois couverts par ce paiement de loyer.
        String mois = moisCouverts(p.getPeriodeDebut(), p.getPeriodeFin());
        if (mois != null) {
            doc.add(new Paragraph("Mois réglé(s) : " + mois).setBold());
        }

        doc.add(new Paragraph("\nMontant : " + p.getMontant() + " Ar").setBold().setFontSize(14));

        doc.add(new Paragraph("\nReçu numérique généré automatiquement par LocaMaison.")
                .setFontSize(9).setItalic());

        doc.close();
        return baos.toByteArray();
    }

    /** Liste lisible des mois couverts par un paiement de loyer (periodeDebut..periodeFin). */
    private String moisCouverts(java.time.LocalDate debut, java.time.LocalDate fin) {
        if (debut == null) return null;
        java.time.format.DateTimeFormatter fmt =
                java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy", java.util.Locale.FRENCH);
        java.time.LocalDate finReelle = (fin != null && !fin.isBefore(debut)) ? fin : debut;
        java.util.List<String> mois = new java.util.ArrayList<>();
        java.time.LocalDate cur = debut.withDayOfMonth(1);
        java.time.LocalDate borne = finReelle.withDayOfMonth(1);
        while (!cur.isAfter(borne) && mois.size() < 36) {
            mois.add(cur.format(fmt));
            cur = cur.plusMonths(1);
        }
        return String.join(", ", mois);
    }

    private String libelleStatut(com.example.demo.model.enums.StatutPaiement s) {
        if (s == null) return "-";
        return switch (s) {
            case EN_ATTENTE -> "En attente";
            case SEQUESTRE -> "En attente";   // libellé simplifié (fonds bloqués/à valider)
            case VALIDE -> "Validé";
            case REFUSE -> "Refusé";
            case REMBOURSE -> "Remboursé";
        };
    }

    private String libelleType(com.example.demo.model.enums.TypePaiement t) {
        if (t == null) return "-";
        return switch (t) {
            case LOYER_MENSUEL -> "Loyer mensuel";
            case DEPOT_GARANTIE -> "Dépôt de garantie (caution)";
            case ACOMPTE_RESERVATION -> "Acompte de réservation";
            case FRAIS_VISITE -> "Frais de visite";
        };
    }

    private String nom(Users u) {
        if (u == null) return "-";
        return (u.getPrenom() == null ? "" : u.getPrenom()) + " " + (u.getNom() == null ? "" : u.getNom());
    }
}
