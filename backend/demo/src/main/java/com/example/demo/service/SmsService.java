package com.example.demo.service;

import com.example.demo.dto.SmsRequest;

public interface SmsService {
    void sendSms(SmsRequest smsRequest);
    void sendVerificationCode(String phoneNumber);
    boolean verifyCode(String phoneNumber, String code);
}
