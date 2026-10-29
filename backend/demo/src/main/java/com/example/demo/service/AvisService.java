package com.example.demo.service;
 
import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
 
@Service
@RequiredArgsConstructor
@Transactional
public class AvisService {
 
    private final AvisRepository avisRepo;
    private final LogementRepository logementRepo;
    private final UserRepository userRepo;
    private final ReservationRepository reservationRepo;

    public AvisResponse creer(AvisRequest req, Long etudiantId) {
        Users etudiant = userRepo.findById(etudiantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Logement logement = logementRepo.findById(req.getLogementId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Avis parent = null;
        if (req.getParentId() != null) {
            parent = avisRepo.findById(req.getParentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avis parent introuvable"));
        }

        // Anti-faux-avis : attribuer une note exige d'avoir réellement réservé/loué le logement
        if (parent == null && req.getNote() != null
                && !reservationRepo.existsByEtudiantIdAndLogementId(etudiantId, logement.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Vous ne pouvez noter qu'un logement que vous avez réservé ou loué");
        }

        Avis avis = Avis.builder()
            .etudiant(etudiant).logement(logement)
            .note(req.getNote()).commentaire(req.getCommentaire())
            .parent(parent)
            .build();

        return toResponse(avisRepo.save(avis));
    }
 
    public AvisResponse modifier(Long id, AvisRequest req, Long etudiantId) {
        Avis avis = avisRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!avis.getEtudiant().getId().equals(etudiantId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        avis.setNote(req.getNote());
        avis.setCommentaire(req.getCommentaire());
        return toResponse(avisRepo.save(avis));
    }
 
    public void supprimer(Long id, Long etudiantId) {
        Avis avis = avisRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!avis.getEtudiant().getId().equals(etudiantId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        avisRepo.delete(avis);
    }
 
    @Transactional(readOnly = true)
    public List<AvisResponse> getAvisLogement(Long logementId) {
        return avisRepo.findByLogementIdOrderByCreatedAtDesc(logementId)
            .stream().map(this::toResponse).toList();
    }
 
    private AvisResponse toResponse(Avis a) {
        Users e = a.getEtudiant();
        return AvisResponse.builder()
            .id(a.getId())
            .etudiant(ProprietaireResponse.builder()
                .id(e.getId()).nom(e.getNom()).prenom(e.getPrenom())
                .avatarUrl(e.getAvatarUrl()).build())
            .note(a.getNote()).commentaire(a.getCommentaire())
            .parentId(a.getParent() != null ? a.getParent().getId() : null)
            .createdAt(a.getCreatedAt())
            .build();
    }
}
 
