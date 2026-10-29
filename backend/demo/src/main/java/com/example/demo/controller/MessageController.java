package com.example.demo.controller;
 
import com.example.demo.dto.*;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.MessageService;
import com.example.demo.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
 
@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {
 
    private final MessageService messageService;
    private final UserRepository userRepository;
 
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> envoyer(
            @Valid @RequestBody MessageRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(messageService.envoyer(req, getUserId(userDetails)));
    }
 
    @GetMapping("/conversation/{autreUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponse>> getConversation(
            @PathVariable Long autreUserId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messageService.getConversation(getUserId(userDetails), autreUserId));
    }
 
    @GetMapping("/inbox")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponse>> getInbox(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messageService.getDerniersMessages(getUserId(userDetails)));
    }
 
    @GetMapping("/non-lus")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getNonLus(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(Map.of("count", messageService.getNombreNonLus(getUserId(userDetails))));
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails instanceof UserPrincipal) {
            return ((UserPrincipal) userDetails).getUserId();
        }
        return userRepository.findByTelephone(userDetails.getUsername())
                .orElseThrow(() -> new com.example.demo.exceptions.ResourceNotFoundException("User not found"))
                .getId();
    }
}
