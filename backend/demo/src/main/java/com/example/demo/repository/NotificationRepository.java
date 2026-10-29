package com.example.demo.repository;

import com.example.demo.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByDestinataireIdOrderByCreatedAtDesc(Long destinataireId);
    List<Notification> findByDestinataireIdOrderByCreatedAtDesc(Long destinataireId);
    long countByDestinataireIdAndLuFalse(Long destinataireId);
}
