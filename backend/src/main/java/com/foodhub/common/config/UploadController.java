package com.foodhub.common.config;

import com.foodhub.common.service.S3UploadService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "Upload")
public class UploadController {

    private final S3UploadService s3UploadService;

    @PostMapping("/restaurant-image")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER','ADMIN')")
    public ResponseEntity<Map<String, String>> uploadRestaurantImage(
            @RequestParam("file") MultipartFile file) {
        String url = s3UploadService.upload(file, "restaurants");
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/menu-image")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER','ADMIN')")
    public ResponseEntity<Map<String, String>> uploadMenuImage(
            @RequestParam("file") MultipartFile file) {
        String url = s3UploadService.upload(file, "menu");
        return ResponseEntity.ok(Map.of("url", url));
    }
}
