package com.example.demo.repository;

import com.example.demo.model.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    Optional<VerificationCode> findTopByPhoneNumberOrderByExpiryDateDesc(String phoneNumber);
    Optional<VerificationCode> findByPhoneNumberAndCodeAndUsedFalse(String phoneNumber, String code);
}
