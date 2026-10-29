package com.example.demo.service.impl;

import com.example.demo.dto.SmsRequest;
import com.example.demo.service.SmsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

import com.example.demo.model.VerificationCode;
import com.example.demo.repository.VerificationCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class SmsServiceImpl implements SmsService {

    @Autowired
    private VerificationCodeRepository verificationCodeRepository;

    @Value("${orange.api.client.id:}")
    private String clientId;

    @Value("${orange.api.client.secret:}")
    private String clientSecret;

    @Value("${orange.api.sender.number:}")
    private String senderNumber;

    private final RestTemplate restTemplate;

    public SmsServiceImpl() {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(5).toMillis());
        this.restTemplate = new RestTemplate(factory);
    }

    private String getAccessToken() {
        String tokenUrl = "https://api.orange.com/oauth/v3/token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "client_credentials");
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private String formatPhoneNumber(String number) {
        if (number == null) return null;
        String cleaned = number.replaceAll("[\\s.()-]", "");
        if (cleaned.isEmpty()) return null;
        if (cleaned.startsWith("0") && cleaned.length() == 10) {
            cleaned = "+261" + cleaned.substring(1);
        } else if (!cleaned.startsWith("+")) {
            cleaned = "+" + cleaned;
        }
        // Un numéro valide doit avoir au moins 9 chiffres (exigence de l'API Orange)
        if (cleaned.replaceAll("\\D", "").length() < 9) return null;
        return cleaned;
    }

    @Override
    public void sendVerificationCode(String phoneNumber) {
        String code = String.format("%04d", new Random().nextInt(10000));
        
        VerificationCode verificationCode = VerificationCode.builder()
                .phoneNumber(phoneNumber)
                .code(code)
                .expiryDate(LocalDateTime.now().plusMinutes(5)) // Valide 5 minutes
                .build();
        
        verificationCodeRepository.save(verificationCode);

        SmsRequest smsRequest = new SmsRequest();
        smsRequest.setPhoneNumber(phoneNumber);
        smsRequest.setMessage("Votre code de vérification LocaMaison est : " + code);
        
        this.sendSms(smsRequest);
    }

    @Override
    public boolean verifyCode(String phoneNumber, String code) {
        return verificationCodeRepository.findByPhoneNumberAndCodeAndUsedFalse(phoneNumber, code)
                .map(vc -> {
                    if (vc.isExpired()) return false;
                    vc.setUsed(true);
                    verificationCodeRepository.save(vc);
                    return true;
                }).orElse(false);
    }

    // Envoi asynchrone : les appels HTTP vers l'API Orange (token + envoi, avec
    // timeouts) ne doivent pas bloquer le flux métier (ex. paiement). Fire-and-forget.
    // Envoi asynchrone (fire-and-forget). IMPORTANT : @Async n'accepte QUE des
    // méthodes void ou Future — un type de retour Object fait échouer l'appel avec
    // « Invalid return type for async method », donc AUCUN SMS n'est envoyé. On
    // retourne donc void.
    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendSms(SmsRequest smsRequest) {
        String accessToken = getAccessToken();
        if (accessToken == null) {
            // Best-effort : sans credentials Orange, on n'échoue pas le flux métier.
            System.out.println("[SMS] (non envoyé — credentials Orange absents) → "
                    + smsRequest.getPhoneNumber() + " : " + smsRequest.getMessage());
            return;
        }

        // Adresse expéditeur : plus de numéro codé en dur. À défaut d'un expéditeur
        // configuré (orange.api.sender.number vide), on utilise l'indicatif Madagascar
        // « +261 » — l'API Orange l'accepte comme senderAddress générique (testé : 201).
        String sender = formatPhoneNumber(senderNumber);
        if (sender == null) {
            sender = "+261";
        }
        String formattedReceiver = formatPhoneNumber(smsRequest.getPhoneNumber());
        if (formattedReceiver == null) {
            System.out.println("[SMS] destinataire absent/invalide (« " + smsRequest.getPhoneNumber() + " ») — non envoyé.");
            return;
        }

        // Le « + » de l'expéditeur doit être encodé (%2B) dans le chemin de l'URL. On
        // passe une URI déjà encodée pour éviter tout double-encodage par RestTemplate.
        java.net.URI smsUri = java.net.URI.create(
            "https://api.orange.com/smsmessaging/v1/outbound/tel:"
            + sender.replace("+", "%2B") + "/requests");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        Map<String, Object> body = new HashMap<>();
        Map<String, Object> outboundSMSMessageRequest = new HashMap<>();
        outboundSMSMessageRequest.put("address", "tel:" + formattedReceiver);

        Map<String, String> outboundSMSTextMessage = new HashMap<>();
        outboundSMSTextMessage.put("message", smsRequest.getMessage());
        outboundSMSMessageRequest.put("outboundSMSTextMessage", outboundSMSTextMessage);

        outboundSMSMessageRequest.put("senderAddress", "tel:" + sender);

        body.put("outboundSMSMessageRequest", outboundSMSMessageRequest);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(smsUri, request, Object.class);
            System.out.println("[SMS] envoyé à " + formattedReceiver + " (statut " + response.getStatusCode() + ")");
        } catch (Exception e) {
            System.err.println("[SMS] échec d'envoi à " + formattedReceiver + " : " + e.getMessage());
        }
    }
}
