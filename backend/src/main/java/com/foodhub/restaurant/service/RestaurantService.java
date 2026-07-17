package com.foodhub.restaurant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.menu.repository.MenuItemRepository;
import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.restaurant.dto.RestaurantDto;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.entity.Restaurant.RestaurantStatus;
import com.foodhub.restaurant.entity.Restaurant.StoreType;
import com.foodhub.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Cacheable("cities")
    public List<String> getCities() {
        return restaurantRepository.findDistinctCities();
    }

    @Transactional(readOnly = true)
    public Page<RestaurantDto> search(String city, String storeType, String search,
                                       Boolean vegOnly, Double maxDeliveryFee,
                                       Double minRating, Boolean openNow, String sortBy, Pageable pageable) {
        StoreType type = (storeType != null && !storeType.isBlank())
                ? StoreType.valueOf(storeType.toUpperCase()) : null;
        return restaurantRepository.search(city, type, search, vegOnly, maxDeliveryFee,
                minRating, openNow, sortBy, pageable).map(this::toDto);
    }

    @Cacheable(value = "restaurant", key = "#id")
    @Transactional(readOnly = true)
    public RestaurantDto getById(Long id) {
        return toDto(restaurantRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<RestaurantDto> getMyRestaurants(Long ownerId) {
        return restaurantRepository.findByOwnerIdAndDeletedAtIsNull(ownerId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public RestaurantDto create(RestaurantDto dto, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Restaurant r = toEntity(dto);
        r.setOwner(owner);
        r.setStatus(RestaurantStatus.PENDING_APPROVAL);
        // Default open hours 9AM-11PM if not set
        if (r.getOpenTime() == null)  r.setOpenTime(java.time.LocalTime.of(9, 0));
        if (r.getCloseTime() == null) r.setCloseTime(java.time.LocalTime.of(23, 0));
        return toDto(restaurantRepository.save(r));
    }

    @Transactional
    public RestaurantDto update(Long id, RestaurantDto dto, Long ownerId) {
        Restaurant r = restaurantRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!r.getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this restaurant");
        updateFields(r, dto);
        return toDto(restaurantRepository.save(r));
    }

    @Transactional
    public void delete(Long id, Long ownerId) {
        Restaurant r = restaurantRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!r.getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this restaurant");
        r.setDeletedAt(LocalDateTime.now());
        restaurantRepository.save(r);
    }

    @Transactional
    public RestaurantDto toggleOpen(Long id, Long ownerId) {
        Restaurant r = restaurantRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!r.getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this restaurant");
        r.setOpen(!r.isOpen());
        return toDto(restaurantRepository.save(r));
    }

    @Transactional
    public RestaurantDto promote(Long id, int days) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        r.setPromoted(true);
        r.setPromotedUntil(LocalDateTime.now().plusDays(days));
        return toDto(restaurantRepository.save(r));
    }

    @Transactional(readOnly = true)
    public List<RestaurantDto> getPendingRestaurants() {
        return restaurantRepository.findByStatusAndDeletedAtIsNull(RestaurantStatus.PENDING_APPROVAL)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public RestaurantDto approve(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        r.setStatus(RestaurantStatus.APPROVED);
        return toDto(restaurantRepository.save(r));
    }

    @Transactional
    public RestaurantDto reject(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        r.setStatus(RestaurantStatus.REJECTED);
        return toDto(restaurantRepository.save(r));
    }

    @Transactional
    public RestaurantDto addPhoto(Long id, String photoUrl, Long ownerId) {
        Restaurant r = restaurantRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!r.getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this restaurant");
        try {
            java.util.List<String> photos = new java.util.ArrayList<>();
            if (r.getPhotoUrlsJson() != null && !r.getPhotoUrlsJson().isBlank())
                photos = new java.util.ArrayList<>(objectMapper.readValue(r.getPhotoUrlsJson(), new TypeReference<>() {}));
            photos.add(photoUrl);
            r.setPhotoUrlsJson(objectMapper.writeValueAsString(photos));
        } catch (Exception e) { throw new BadRequestException("Failed to update photos"); }
        return toDto(restaurantRepository.save(r));
    }

    @Transactional
    public RestaurantDto removePhoto(Long id, String photoUrl, Long ownerId) {
        Restaurant r = restaurantRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        if (!r.getOwner().getId().equals(ownerId))
            throw new BadRequestException("You don't own this restaurant");
        try {
            java.util.List<String> photos = new java.util.ArrayList<>();
            if (r.getPhotoUrlsJson() != null)
                photos = new java.util.ArrayList<>(objectMapper.readValue(r.getPhotoUrlsJson(), new TypeReference<>() {}));
            photos.remove(photoUrl);
            r.setPhotoUrlsJson(objectMapper.writeValueAsString(photos));
        } catch (Exception e) { throw new BadRequestException("Failed to update photos"); }
        return toDto(restaurantRepository.save(r));
    }

    private RestaurantDto toDto(Restaurant r) {
        RestaurantDto dto = new RestaurantDto();
        dto.setId(r.getId());
        dto.setName(r.getName());
        dto.setDescription(r.getDescription());
        dto.setCuisineType(r.getCuisineType());
        dto.setStoreType(r.getStoreType());
        dto.setAddress(r.getAddress());
        dto.setCity(r.getCity());
        dto.setPincode(r.getPincode());
        dto.setLatitude(r.getLatitude());
        dto.setLongitude(r.getLongitude());
        dto.setPhone(r.getPhone());
        dto.setEmail(r.getEmail());
        dto.setLogoUrl(r.getLogoUrl());
        dto.setBannerUrl(r.getBannerUrl());
        // Parse photo gallery
        try {
            if (r.getPhotoUrlsJson() != null && !r.getPhotoUrlsJson().isBlank())
                dto.setPhotoUrls(objectMapper.readValue(r.getPhotoUrlsJson(), new TypeReference<>() {}));
        } catch (Exception ignored) {}
        dto.setAvgRating(r.getAvgRating());
        dto.setTotalRatings(r.getTotalRatings());
        dto.setAvgDeliveryTimeMinutes(r.getAvgDeliveryTimeMinutes());
        dto.setDeliveryFee(r.getDeliveryFee());
        dto.setMinOrderAmount(r.getMinOrderAmount());
        dto.setOpenTime(r.getOpenTime());
        dto.setCloseTime(r.getCloseTime());
        dto.setStatus(r.getStatus());
        dto.setActive(r.isActive());
        dto.setOpen(r.isOpen());
        dto.setPromoted(r.isPromoted() && (r.getPromotedUntil() == null || r.getPromotedUntil().isAfter(LocalDateTime.now())));
        dto.setCreatedAt(r.getCreatedAt());
        // Social proof: recent orders in last hour
        try {
            java.time.LocalDateTime since = LocalDateTime.now().minusHours(1);
            int recentCount = orderRepository.countByRestaurantIdAndCreatedAtAfter(r.getId(), since);
            dto.setRecentOrderCount(recentCount);
            // Most ordered item
            menuItemRepository.findMostOrderedByRestaurant(r.getId())
                    .ifPresent(dto::setMostOrderedItem);
        } catch (Exception ignored) {}
        return dto;
    }

    private Restaurant toEntity(RestaurantDto dto) {
        Restaurant r = new Restaurant();
        updateFields(r, dto);
        return r;
    }

    private void updateFields(Restaurant r, RestaurantDto dto) {
        r.setName(dto.getName());
        r.setDescription(dto.getDescription());
        r.setCuisineType(dto.getCuisineType());
        r.setStoreType(dto.getStoreType() != null ? dto.getStoreType() : StoreType.RESTAURANT);
        r.setAddress(dto.getAddress());
        r.setCity(dto.getCity());
        r.setPincode(dto.getPincode());
        r.setLatitude(dto.getLatitude());
        r.setLongitude(dto.getLongitude());
        r.setPhone(dto.getPhone());
        r.setEmail(dto.getEmail());
        r.setAvgDeliveryTimeMinutes(dto.getAvgDeliveryTimeMinutes() != null ? dto.getAvgDeliveryTimeMinutes() : 30);
        r.setDeliveryFee(dto.getDeliveryFee() != null ? dto.getDeliveryFee() : 0.0);
        r.setMinOrderAmount(dto.getMinOrderAmount() != null ? dto.getMinOrderAmount() : 0.0);
        r.setOpenTime(dto.getOpenTime());
        r.setCloseTime(dto.getCloseTime());
    }
}
