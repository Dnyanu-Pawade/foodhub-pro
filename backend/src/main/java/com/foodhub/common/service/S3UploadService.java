package com.foodhub.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class S3UploadService {

    @Value("${aws.s3.bucket}")  private String bucket;
    @Value("${aws.s3.region}")  private String region;
    @Value("${aws.access-key}") private String accessKey;
    @Value("${aws.secret-key}") private String secretKey;
    @Value("${app.upload-dir:uploads}") private String uploadDir;
    @Value("${app.base-url:http://localhost:8082}") private String baseUrl;

    public String upload(MultipartFile file, String folder) {
        if ("your_access_key".equals(accessKey)) {
            return saveLocally(file, folder);
        }
        try {
            String key = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
            S3Client s3 = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
            s3.putObject(PutObjectRequest.builder()
                    .bucket(bucket).key(key)
                    .contentType(file.getContentType())
                    .build(),
                    RequestBody.fromBytes(file.getBytes()));
            return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
        } catch (Exception e) {
            log.error("S3 upload failed, falling back to local: {}", e.getMessage());
            return saveLocally(file, folder);
        }
    }

    private String saveLocally(MultipartFile file, String folder) {
        try {
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path dir = Paths.get(uploadDir, folder);
            Files.createDirectories(dir);
            Path dest = dir.resolve(filename);
            file.transferTo(dest.toFile());
            String url = baseUrl + "/uploads/" + folder + "/" + filename;
            log.info("Saved file locally: {}", url);
            return url;
        } catch (Exception e) {
            log.error("Local save failed: {}", e.getMessage());
            return "https://placehold.co/400x300?text=No+Image";
        }
    }
}
