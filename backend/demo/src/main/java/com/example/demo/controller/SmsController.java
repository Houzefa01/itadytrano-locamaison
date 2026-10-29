package com.example.demo.controller;

import com.example.demo.dto.SmsRequest;
import com.example.demo.service.SmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sms")
public class SmsController {

    @Autowired
    private SmsService smsService;

    @PostMapping("/send")
    public ResponseEntity<Object> sendSms(@RequestBody SmsRequest smsRequest) {
        // Envoi asynchrone (fire-and-forget) : on accuse réception immédiatement.
        smsService.sendSms(smsRequest);
        return ResponseEntity.accepted().body("SMS en cours d'envoi");
    }

    @PostMapping("/send-code")
    public ResponseEntity<String> sendCode(@RequestParam String phoneNumber) {
        try {
            smsService.sendVerificationCode(phoneNumber);
            return ResponseEntity.ok("Code envoyé avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de l'envoi du code: " + e.getMessage());
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<String> verifyCode(@RequestParam String phoneNumber, @RequestParam String code) {
        boolean isValid = smsService.verifyCode(phoneNumber, code);
        if (isValid) {
            return ResponseEntity.ok("Code valide");
        } else {
            return ResponseEntity.status(400).body("Code invalide ou expiré");
        }
    }
}
