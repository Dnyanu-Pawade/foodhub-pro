package com.foodhub.complaint.controller;

import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.auth.security.UserDetailsImpl;
import com.foodhub.complaint.entity.Complaint;
import com.foodhub.complaint.entity.Complaint.ComplaintStatus;
import com.foodhub.complaint.repository.ComplaintRepository;
import com.foodhub.common.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Complaints")
public class ComplaintController {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    // Customer: raise complaint
    @PostMapping("/api/complaints")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Complaint> create(@RequestBody Complaint body,
                                            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        body.setId(null);
        body.setUser(user);
        body.setStatus(ComplaintStatus.OPEN);
        return ResponseEntity.ok(complaintRepository.save(body));
    }

    // Customer: my complaints
    @GetMapping("/api/complaints/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Complaint>> myComplaints(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(complaintRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    // Admin: list all complaints
    @GetMapping("/api/admin/complaints")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Complaint>> listAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String status) {
        PageRequest pr = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Complaint> result = (status != null && !status.isBlank())
                ? complaintRepository.findByStatusOrderByCreatedAtDesc(ComplaintStatus.valueOf(status), pr)
                : complaintRepository.findAllByOrderByCreatedAtDesc(pr);
        return ResponseEntity.ok(result);
    }

    // Admin: stats
    @GetMapping("/api/admin/complaints/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> stats() {
        List<Complaint> all = complaintRepository.findAll();
        long open       = all.stream().filter(c -> c.getStatus() == ComplaintStatus.OPEN).count();
        long inProgress = all.stream().filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS).count();
        long resolvedToday = all.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED
                && c.getUpdatedAt() != null
                && c.getUpdatedAt().toLocalDate().equals(java.time.LocalDate.now())).count();
        return ResponseEntity.ok(Map.of(
            "open", open, "inProgress", inProgress,
            "resolvedToday", resolvedToday, "avgResponseHours", 2
        ));
    }

    // Admin: reply
    @PostMapping("/api/admin/complaints/{id}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reply(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Complaint c = complaintRepository.findById(id).orElseThrow();
        c.setAdminResponse(body.get("message"));
        c.setStatus(ComplaintStatus.IN_PROGRESS);
        complaintRepository.save(c);
        return ResponseEntity.ok(Map.of("message", "Reply sent"));
    }

    // Admin: resolve complaint
    @PatchMapping("/api/admin/complaints/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Complaint> resolve(@PathVariable Long id,
                                             @RequestBody Map<String, String> body,
                                             @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        User admin = userRepository.findById(userDetails.getId()).orElseThrow();
        complaint.setAdminResponse(body.get("response"));
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedBy(admin);
        return ResponseEntity.ok(complaintRepository.save(complaint));
    }

    // Admin: update status
    @PatchMapping("/api/admin/complaints/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Complaint> updateStatus(@PathVariable Long id,
                                                  @RequestParam ComplaintStatus status) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        complaint.setStatus(status);
        return ResponseEntity.ok(complaintRepository.save(complaint));
    }
}
