package com.foodhub.order.controller;

import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.delivery.repository.DeliveryRepository;
import com.foodhub.order.dto.OrderRequest;
import com.foodhub.order.dto.OrderResponse;
import com.foodhub.order.entity.Order.OrderStatus;
import com.foodhub.order.service.OrderService;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders")
public class OrderController {

    private final OrderService orderService;
    private final DeliveryRepository deliveryRepository;

    @GetMapping("/scheduled")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<OrderResponse>> getScheduled(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(orderService.getScheduledOrders(user.getId()));
    }

    @DeleteMapping("/scheduled/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> cancelScheduled(@PathVariable Long id,
                                                @AuthenticationPrincipal UserDetailsImpl user) {
        orderService.cancelScheduledOrder(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody OrderRequest request,
                                                    @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(orderService.placeOrder(request, user.getId()));
    }

    // Guest order from QR code scan — no auth required
    @PostMapping("/guest")
    public ResponseEntity<OrderResponse> placeGuestOrder(@RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.placeGuestOrder(request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Page<OrderResponse>> myOrders(@AuthenticationPrincipal UserDetailsImpl user,
                                                        @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(orderService.getMyOrders(user.getId(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<List<OrderResponse>> getRestaurantOrders(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(orderService.getRestaurantOrders(restaurantId));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN')")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id,
                                                      @RequestParam OrderStatus status,
                                                      @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(orderService.updateStatus(id, status, user.getId()));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id,
                                                     @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(orderService.cancelOrder(id, user.getId()));
    }

    @PostMapping("/{id}/verify-otp")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<Void> verifyOtp(@PathVariable Long id,
                                          @RequestParam String otp,
                                          @AuthenticationPrincipal UserDetailsImpl user) {
        orderService.verifyDeliveryOtp(id, user.getId(), otp);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/customer-location")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> updateCustomerLocation(@PathVariable Long id,
                                                       @RequestParam Double lat,
                                                       @RequestParam Double lng,
                                                       @AuthenticationPrincipal UserDetailsImpl user) {
        orderService.updateCustomerLocation(id, user.getId(), lat, lng);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/delivery-partner")
    public ResponseEntity<?> getDeliveryPartner(@PathVariable Long id) {
        return deliveryRepository.findByOrderId(id)
                .filter(d -> d.getPartner() != null)
                .map(d -> {
                    var p = d.getPartner();
                    return ResponseEntity.ok(Map.of(
                        "name",            p.getFullName() != null ? p.getFullName() : p.getUsername(),
                        "phone",           p.getPhone() != null ? p.getPhone() : "",
                        "photoUrl",        p.getProfileImageUrl() != null ? p.getProfileImageUrl() : "",
                        "vehicleNumber",   "",
                        "rating",          4.5,
                        "totalDeliveries", 0
                    ));
                })
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long id) throws Exception {
        OrderResponse order = orderService.getById(id);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titleFont  = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD, new BaseColor(249, 115, 22));
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);
        Font smallFont  = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BaseColor.GRAY);

        doc.add(new Paragraph("FoodHub Pro", titleFont));
        doc.add(new Paragraph("Tax Invoice", headerFont));
        doc.add(Chunk.NEWLINE);
        doc.add(new Paragraph("Order #" + order.getId() + "  |  " + order.getCreatedAt().toLocalDate(), normalFont));
        doc.add(new Paragraph("Restaurant: " + order.getRestaurantName(), normalFont));
        doc.add(new Paragraph("Customer: " + order.getCustomerName(), normalFont));
        doc.add(new Paragraph("Delivery: " + order.getDeliveryAddress(), normalFont));
        doc.add(new Paragraph("Status: " + order.getStatus(), normalFont));
        doc.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{5, 2, 2, 2});
        for (String h : new String[]{"Item", "Qty", "Unit Price", "Total"}) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new BaseColor(249, 115, 22));
            cell.setPadding(6);
            table.addCell(cell);
        }
        for (OrderResponse.OrderItemResponse item : order.getItems()) {
            table.addCell(new Phrase(item.getItemName(), normalFont));
            table.addCell(new Phrase(String.valueOf(item.getQuantity()), normalFont));
            table.addCell(new Phrase("Rs." + item.getUnitPrice(), normalFont));
            table.addCell(new Phrase("Rs." + item.getTotalPrice(), normalFont));
        }
        doc.add(table);
        doc.add(Chunk.NEWLINE);

        doc.add(new Paragraph("Subtotal:      Rs." + order.getSubtotal(), normalFont));
        doc.add(new Paragraph("Delivery Fee:  Rs." + order.getDeliveryFee(), normalFont));
        if (order.getDiscount() != null && order.getDiscount().doubleValue() > 0)
            doc.add(new Paragraph("Discount:     -Rs." + order.getDiscount(), normalFont));
        Font totalFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        doc.add(new Paragraph("TOTAL:         Rs." + order.getTotalAmount(), totalFont));
        doc.add(Chunk.NEWLINE);
        doc.add(new Paragraph("Payment: " + order.getPaymentMethod() + " | " + order.getPaymentStatus(), smallFont));
        doc.add(new Paragraph("Thank you for ordering with FoodHub Pro!", smallFont));
        doc.close();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }
}
