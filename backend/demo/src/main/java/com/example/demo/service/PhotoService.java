package com.example.demo.service;
 
import com.example.demo.dto.PhotoResponse;
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
public class PhotoService {
 
    private final PhotoRepository photoRepo;
    private final LogementRepository logementRepo;
 
    public PhotoResponse ajouterPhoto(Long logementId, String url,
                                       Boolean principale, Long proprietaireId) {
        Logement logement = logementRepo.findById(logementId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!logement.getProprietaire().getId().equals(proprietaireId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (photoRepo.countByLogementId(logementId) >= 10)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Maximum 10 photos par logement");
 
        if (Boolean.TRUE.equals(principale)) {
            photoRepo.resetPrincipale(logementId);
        }
 
        int ordre = (int) photoRepo.countByLogementId(logementId);
        Photo photo = Photo.builder()
            .logement(logement).url(url)
            .principale(Boolean.TRUE.equals(principale) ||
                        photoRepo.countByLogementId(logementId) == 0)
            .ordre(ordre)
            .build();
 
        Photo saved = photoRepo.save(photo);
        return PhotoResponse.builder()
            .id(saved.getId()).url(saved.getUrl())
            .principale(saved.getPrincipale()).ordre(saved.getOrdre())
            .build();
    }
 
    public void supprimerPhoto(Long photoId, Long proprietaireId) {
        Photo photo = photoRepo.findById(photoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!photo.getLogement().getProprietaire().getId().equals(proprietaireId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        photoRepo.delete(photo);
    }
 
    public void definirPrincipale(Long photoId, Long proprietaireId) {
        Photo photo = photoRepo.findById(photoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!photo.getLogement().getProprietaire().getId().equals(proprietaireId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        photoRepo.resetPrincipale(photo.getLogement().getId());
        photo.setPrincipale(true);
        photoRepo.save(photo);
    }
 
    @Transactional(readOnly = true)
    public List<PhotoResponse> getPhotos(Long logementId) {
        return photoRepo.findByLogementIdOrderByOrdreAsc(logementId)
            .stream().map(p -> PhotoResponse.builder()
                .id(p.getId()).url(p.getUrl())
                .principale(p.getPrincipale()).ordre(p.getOrdre())
                .build()).toList();
    }
}
