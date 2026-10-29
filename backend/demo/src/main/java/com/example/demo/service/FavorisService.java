package com.example.demo.service;
 
import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.model.enums.*;
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
public class FavorisService {
 
    private final FavoriRepository favorisRepo;
    private final LogementRepository logementRepo;
    private final UserRepository userRepo;
    private final LogementService logementService;
 
    // Toggle favori → retourne true si ajouté, false si supprimé
    public boolean toggleFavori(Long etudiantId, Long logementId) {
        if (favorisRepo.existsByEtudiantIdAndLogementId(etudiantId, logementId)) {
            favorisRepo.deleteByEtudiant_IdAndLogement_Id(etudiantId, logementId);
            return false;
        }
        Users etudiant = userRepo.findById(etudiantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Logement logement = logementRepo.findById(logementId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        favorisRepo.save(Favori.builder().etudiant(etudiant).logement(logement).build());
        return true;
    }
 
    @Transactional(readOnly = true)
   public List<LogementResponse> getFavoris(Long etudiantId) {

        return favorisRepo.findByEtudiant_IdOrderByCreatedAtDesc(etudiantId)
                .stream()
                .map(Favori::getLogement)
                .map(logementService::toResponse)
                .toList();
    }
 
    @Transactional(readOnly = true)
    public boolean isFavori(Long etudiantId, Long logementId) {
        return favorisRepo.existsByEtudiantIdAndLogementId(etudiantId, logementId);
    }

    public List<LogementResponse> getMesFavoris(Long etudiantId) {

    return favorisRepo.findByEtudiant_IdOrderByCreatedAtDesc(etudiantId)
            .stream()
            .map(f -> logementService.toResponse(f.getLogement()))
            .toList();
}
}
