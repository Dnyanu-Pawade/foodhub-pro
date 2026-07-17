package com.foodhub.chat.controller;

import com.foodhub.chat.entity.ChatMessage;
import com.foodhub.chat.repository.ChatMessageRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Data
    public static class ChatPayload {
        private Long senderId;
        private String senderName;
        private String message;
    }

    @MessageMapping("/chat/{restaurantId}")
    public void handleChat(@DestinationVariable Long restaurantId, ChatPayload payload) {
        ChatMessage msg = new ChatMessage();
        msg.setRestaurantId(restaurantId);
        msg.setSenderId(payload.getSenderId());
        msg.setSenderName(payload.getSenderName());
        msg.setMessage(payload.getMessage());
        chatRepository.save(msg);
        messagingTemplate.convertAndSend("/topic/chat/" + restaurantId, msg);
    }

    @GetMapping("/api/chat/{restaurantId}/history")
    public ResponseEntity<List<ChatMessage>> history(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(chatRepository.findTop50ByRestaurantIdOrderBySentAtAsc(restaurantId));
    }
}
