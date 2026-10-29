package com.example.demo.repository;
import org.springframework.transaction.annotation.Transactional;
import com.example.demo.model.Message;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("SELECT m FROM Message m WHERE (m.expediteur.id = :u1 AND m.destinataire.id = :u2) OR (m.expediteur.id = :u2 AND m.destinataire.id = :u1) ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("u1") Long userId1, @Param("u2") Long userId2);

      // messages non lus
    long countByDestinataireIdAndLuFalse(Long destinataireId);

    // derniers messages par conversation (groupe par interlocuteur)
    @Query(value = """
        SELECT DISTINCT ON (interlocuteur_id) *
        FROM (
            SELECT m.*,
                   CASE WHEN m.expediteur_id = :userId THEN m.destinataire_id
                        ELSE m.expediteur_id END as interlocuteur_id
            FROM messages m
            WHERE m.expediteur_id = :userId OR m.destinataire_id = :userId
        ) sub
        ORDER BY interlocuteur_id, created_at DESC
    """, nativeQuery = true)
    List<Message> findDerniersMessages(@Param("userId") Long userId);

    // marquer comme lus les messages reçus de l'autre utilisateur
    @Modifying
    @Transactional
    @Query("""
        UPDATE Message m
        SET m.lu = true
        WHERE m.destinataire.id = :currentUser
          AND m.expediteur.id = :otherUser
          AND m.lu = false
    """)
    void marquerLusParConversation(@Param("currentUser") Long currentUser,
                                    @Param("otherUser") Long otherUser);
}
