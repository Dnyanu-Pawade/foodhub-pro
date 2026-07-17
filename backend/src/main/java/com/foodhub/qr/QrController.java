package com.foodhub.qr;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/qr")
@Slf4j
@Tag(name = "QR Code")
public class QrController {

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @GetMapping(value = "/restaurant/{restaurantId}/table/{tableNumber}",
                produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> generateTableQr(@PathVariable Long restaurantId,
                                                  @PathVariable String tableNumber) throws Exception {
        String url = baseUrl + "/order?restaurant=" + restaurantId + "&table=" + tableNumber;
        byte[] qrBytes = generateQrPng(url, 300);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrBytes);
    }

    @GetMapping(value = "/restaurant/{restaurantId}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> generateRestaurantQr(@PathVariable Long restaurantId) throws Exception {
        String url = baseUrl + "/restaurant/" + restaurantId;
        byte[] qrBytes = generateQrPng(url, 300);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrBytes);
    }

    private byte[] generateQrPng(String content, int size) throws Exception {
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size,
                Map.of(EncodeHintType.MARGIN, 1));
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", out);
        return out.toByteArray();
    }
}
