package com.foodhub.common.config;

import com.foodhub.auth.entity.Role;
import com.foodhub.auth.entity.Role.ERole;
import com.foodhub.auth.entity.User;
import com.foodhub.auth.repository.RoleRepository;
import com.foodhub.auth.repository.UserRepository;
import com.foodhub.collection.entity.FoodCollection;
import com.foodhub.collection.repository.FoodCollectionRepository;
import com.foodhub.menu.entity.MenuItem;
import com.foodhub.menu.repository.MenuItemRepository;
import com.foodhub.restaurant.entity.Restaurant;
import com.foodhub.restaurant.entity.Restaurant.RestaurantStatus;
import com.foodhub.restaurant.repository.RestaurantRepository;
import com.foodhub.review.entity.Review;
import com.foodhub.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FoodCollectionRepository collectionRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final ReviewRepository reviewRepository;

    @Override
    public void run(String... args) {
        seedRoles();
        seedUsers();
        seedCollections();
        seedRestaurants();
    }

    private void seedRoles() {
        for (ERole role : ERole.values()) {
            if (roleRepository.findByName(role).isEmpty()) {
                roleRepository.save(new Role(role));
                log.info("Seeded role: {}", role);
            }
        }
    }

    private void seedUsers() {
        createUser("admin",     "admin@foodhub.com",    "Admin@123",    "FoodHub Admin",  "9000000001", ERole.ROLE_ADMIN);
        createUser("customer1", "customer@foodhub.com", "Customer@123", "Ravi Kumar",     "9000000002", ERole.ROLE_CUSTOMER);
        createUser("customer2", "customer2@foodhub.com","Customer@123", "Priya Sharma",   "9000000005", ERole.ROLE_CUSTOMER);
        createUser("owner1",    "owner@foodhub.com",    "Owner@123",    "Sneha Patil",    "9000000003", ERole.ROLE_RESTAURANT_OWNER);
        createUser("delivery1", "delivery@foodhub.com", "Delivery@123", "Amit Singh",     "9000000004", ERole.ROLE_DELIVERY_PARTNER);
    }

    private void createUser(String username, String email, String password,
                            String fullName, String phone, ERole role) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User(username, email, passwordEncoder.encode(password), fullName, phone);
            user.setRoles(Set.of(roleRepository.findByName(role).orElseThrow()));
            userRepository.save(user);
            log.info("Seeded user: {} / {} [{}]", username, password, role);
        }
    }

    private void seedCollections() {
        if (collectionRepository.count() > 0) return;
        Object[][] data = {
            {"Best Biryani",       "🍱", "Biryani",  0},
            {"Top Rated Cafes",    "☕",  "Cafe",     1},
            {"Pizza Lovers",       "🍕", "Pizza",    2},
            {"Healthy Bowls",      "🥗", "Healthy",  3},
            {"Burger Joints",      "🍔", "Burger",   4},
            {"Chinese Favourites", "🍜", "Chinese",  5},
            {"South Indian",       "🥞", "Dosa",     6},
            {"Sweet Treats",       "🍦", "Desserts", 7},
        };
        for (Object[] d : data) {
            FoodCollection col = new FoodCollection();
            col.setTitle((String) d[0]);
            col.setEmoji((String) d[1]);
            col.setTag((String) d[2]);
            col.setDisplayOrder((int) d[3]);
            col.setActive(true);
            collectionRepository.save(col);
        }
        log.info("Seeded {} food collections", data.length);
    }

    private void seedRestaurants() {
        if (restaurantRepository.count() > 0) return;

        User owner = userRepository.findByUsername("owner1").orElseThrow();
        User c1    = userRepository.findByUsername("customer1").orElseThrow();
        User c2    = userRepository.findByUsername("customer2").orElseThrow();

        // ── 2 Nanded restaurants ─────────────────────────────────────────────
        Restaurant r1 = make(owner, "Nanded Biryani House", "Authentic Hyderabadi dum biryani in the heart of Nanded",
            "Biryani", "Shivaji Nagar, Nanded", "Nanded", "431601",
            18.3625, 77.3089, "9423000001", 30.0, 149.0, 25, 4.5, 320,
            "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
            "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800");

        Restaurant r2 = make(owner, "Cafe Nanded Central", "Trendy cafe with coffee, sandwiches and desserts",
            "Cafe", "Vazirabad Road, Nanded", "Nanded", "431601",
            18.3520, 77.3200, "9423000002", 0.0, 99.0, 20, 4.3, 180,
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800");

        // ── 11 more across India ─────────────────────────────────────────────
        Restaurant r3 = make(owner, "Mumbai Spice Garden", "Best street-style Mumbai food",
            "Street Food", "Andheri West, Mumbai", "Mumbai", "400058",
            19.1136, 72.8697, "9820000001", 25.0, 99.0, 35, 4.2, 500,
            "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800");

        Restaurant r4 = make(owner, "Delhi Dhaba Express", "Authentic North Indian dhaba flavours",
            "North Indian", "Connaught Place, Delhi", "Delhi", "110001",
            28.6315, 77.2167, "9810000001", 40.0, 199.0, 40, 4.4, 750,
            "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800");

        Restaurant r5 = make(owner, "Bangalore Pizza Co.", "Wood-fired artisan pizzas",
            "Pizza", "Koramangala, Bangalore", "Bangalore", "560034",
            12.9352, 77.6245, "9900000001", 30.0, 149.0, 30, 4.6, 420,
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
            "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800");

        Restaurant r6 = make(owner, "Chennai Dosa Palace", "Crispy dosas and South Indian thalis",
            "South Indian", "T. Nagar, Chennai", "Chennai", "600017",
            13.0418, 80.2341, "9444000001", 0.0, 79.0, 25, 4.7, 900,
            "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400",
            "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800");

        Restaurant r7 = make(owner, "Pune Burger Lab", "Gourmet burgers with fresh ingredients",
            "Burger", "FC Road, Pune", "Pune", "411004",
            18.5204, 73.8567, "9800000001", 20.0, 129.0, 25, 4.1, 280,
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
            "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800");

        Restaurant r8 = make(owner, "Hyderabad Dum Biryani", "Royal Nizami biryani experience",
            "Biryani", "Banjara Hills, Hyderabad", "Hyderabad", "500034",
            17.4126, 78.4483, "9490000001", 35.0, 199.0, 45, 4.8, 1200,
            "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
            "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800");

        Restaurant r9 = make(owner, "Kolkata Rolls & More", "Famous Kolkata kathi rolls",
            "Street Food", "Park Street, Kolkata", "Kolkata", "700016",
            22.5535, 88.3522, "9830000001", 15.0, 89.0, 20, 4.3, 650,
            "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
            "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800");

        Restaurant r10 = make(owner, "Ahmedabad Thali House", "Unlimited Gujarati thali",
            "Gujarati", "CG Road, Ahmedabad", "Ahmedabad", "380006",
            23.0225, 72.5714, "9979000001", 0.0, 149.0, 30, 4.5, 480,
            "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800");

        Restaurant r11 = make(owner, "Jaipur Sweet Corner", "Traditional Rajasthani sweets & snacks",
            "Desserts", "MI Road, Jaipur", "Jaipur", "302001",
            26.9124, 75.7873, "9414000001", 0.0, 49.0, 15, 4.4, 320,
            "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400",
            "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800");

        Restaurant r12 = make(owner, "Goa Seafood Shack", "Fresh catch grilled to perfection",
            "Seafood", "Calangute Beach, Goa", "Goa", "403516",
            15.5440, 73.7527, "9822000001", 50.0, 299.0, 40, 4.6, 390,
            "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400",
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800");

        Restaurant r13 = make(owner, "Nagpur Orange Cafe", "Healthy bowls, juices and light bites",
            "Healthy", "Sitabuldi, Nagpur", "Nagpur", "440012",
            21.1458, 79.0882, "9823000001", 0.0, 99.0, 20, 4.2, 210,
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
            "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800");

        // ── Menus ────────────────────────────────────────────────────────────
        addMenuItems(r1, new Object[][]{
            {"Chicken Dum Biryani",  "Slow-cooked with saffron & whole spices", "280", "Biryani",  false},
            {"Mutton Biryani",       "Tender mutton pieces in aromatic rice",   "350", "Biryani",  false},
            {"Veg Biryani",          "Fresh vegetables in basmati rice",        "180", "Biryani",  true},
            {"Chicken Curry",        "Rich Nanded-style chicken curry",         "220", "Curries",  false},
            {"Dal Tadka",            "Yellow lentils with ghee tadka",          "120", "Curries",  true},
            {"Butter Naan",          "Soft naan with butter",                   "40",  "Breads",   true},
            {"Raita",                "Chilled yogurt with cucumber",            "60",  "Sides",    true},
            {"Gulab Jamun",          "Soft milk dumplings in sugar syrup",      "80",  "Desserts", true},
        });

        addMenuItems(r2, new Object[][]{
            {"Cappuccino",           "Rich espresso with steamed milk foam",    "120", "Coffee",   true},
            {"Cold Coffee",          "Chilled blended coffee with ice cream",   "150", "Coffee",   true},
            {"Veg Club Sandwich",    "Grilled sandwich with veggies & cheese",  "160", "Sandwiches",true},
            {"Chicken Sandwich",     "Grilled chicken with lettuce & mayo",     "190", "Sandwiches",false},
            {"Chocolate Brownie",    "Warm fudge brownie with vanilla ice cream","140","Desserts",  true},
            {"Fruit Smoothie",       "Seasonal fruits blended fresh",           "130", "Beverages", true},
            {"Masala Chai",          "Spiced Indian tea",                       "60",  "Beverages", true},
            {"Pasta Arrabbiata",     "Penne in spicy tomato sauce",             "200", "Mains",    true},
        });

        addMenuItems(r3, new Object[][]{
            {"Vada Pav",             "Mumbai's favourite street burger",        "40",  "Snacks",   true},
            {"Pav Bhaji",            "Spiced mashed veggies with buttered pav", "120", "Mains",    true},
            {"Chicken Frankie",      "Spicy chicken roll",                      "130", "Rolls",    false},
            {"Bhel Puri",            "Puffed rice with chutneys",               "60",  "Snacks",   true},
            {"Misal Pav",            "Spicy sprouted curry with pav",           "110", "Mains",    true},
        });

        addMenuItems(r4, new Object[][]{
            {"Butter Chicken",       "Creamy tomato-based chicken curry",       "320", "Mains",    false},
            {"Dal Makhani",          "Slow-cooked black lentils",               "220", "Mains",    true},
            {"Paneer Tikka",         "Grilled cottage cheese with spices",      "280", "Starters", true},
            {"Garlic Naan",          "Tandoor-baked garlic bread",              "60",  "Breads",   true},
            {"Lassi",                "Chilled yogurt drink",                    "80",  "Beverages",true},
        });

        addMenuItems(r5, new Object[][]{
            {"Margherita Pizza",     "Classic tomato, mozzarella, basil",       "299", "Pizza",    true},
            {"BBQ Chicken Pizza",    "Smoky BBQ sauce with grilled chicken",    "399", "Pizza",    false},
            {"Farmhouse Pizza",      "Loaded with fresh vegetables",            "349", "Pizza",    true},
            {"Garlic Bread",         "Crispy garlic butter bread",              "149", "Sides",    true},
            {"Tiramisu",             "Classic Italian coffee dessert",          "199", "Desserts", true},
        });

        addMenuItems(r6, new Object[][]{
            {"Masala Dosa",          "Crispy dosa with spiced potato filling",  "120", "Dosa",     true},
            {"Rava Dosa",            "Crispy semolina dosa",                    "130", "Dosa",     true},
            {"Idli Sambar",          "Steamed rice cakes with lentil soup",     "90",  "Breakfast",true},
            {"Medu Vada",            "Crispy lentil donuts",                    "80",  "Breakfast",true},
            {"Filter Coffee",        "Traditional South Indian coffee",         "60",  "Beverages",true},
            {"Chettinad Chicken",    "Spicy Chettinad-style chicken curry",     "280", "Mains",    false},
        });

        addMenuItems(r7, new Object[][]{
            {"Classic Beef Burger",  "Juicy beef patty with all toppings",      "299", "Burgers",  false},
            {"Crispy Chicken Burger","Fried chicken with coleslaw",             "249", "Burgers",  false},
            {"Veggie Burger",        "Black bean patty with avocado",           "199", "Burgers",  true},
            {"Loaded Fries",         "Fries with cheese sauce & jalapeños",     "149", "Sides",    true},
            {"Milkshake",            "Thick creamy milkshake",                  "179", "Beverages",true},
        });

        addMenuItems(r8, new Object[][]{
            {"Hyderabadi Chicken Biryani","Authentic dum biryani",              "320", "Biryani",  false},
            {"Mutton Biryani",       "Slow-cooked mutton dum biryani",          "420", "Biryani",  false},
            {"Mirchi Ka Salan",      "Green chilli curry",                      "150", "Sides",    true},
            {"Double Ka Meetha",     "Hyderabadi bread pudding",                "120", "Desserts", true},
            {"Irani Chai",           "Strong milky tea",                        "50",  "Beverages",true},
        });

        addMenuItems(r9, new Object[][]{
            {"Egg Kathi Roll",       "Egg-wrapped spicy roll",                  "80",  "Rolls",    false},
            {"Chicken Kathi Roll",   "Chicken tikka in flaky paratha",          "110", "Rolls",    false},
            {"Paneer Kathi Roll",    "Spiced paneer in paratha",                "100", "Rolls",    true},
            {"Jhalmuri",             "Spicy puffed rice snack",                 "40",  "Snacks",   true},
        });

        addMenuItems(r10, new Object[][]{
            {"Gujarati Thali",       "Unlimited dal, sabzi, roti, rice, sweet", "250", "Thali",    true},
            {"Dhokla",               "Steamed fermented chickpea cake",         "80",  "Snacks",   true},
            {"Fafda Jalebi",         "Crispy fafda with sweet jalebi",          "100", "Breakfast",true},
            {"Undhiyu",              "Mixed winter vegetable curry",            "180", "Mains",    true},
        });

        addMenuItems(r11, new Object[][]{
            {"Ghewar",               "Traditional Rajasthani sweet",            "120", "Sweets",   true},
            {"Mawa Kachori",         "Sweet stuffed pastry",                    "60",  "Snacks",   true},
            {"Pyaaz Kachori",        "Spicy onion-filled pastry",               "50",  "Snacks",   true},
            {"Lassi",                "Sweet or salted yogurt drink",            "80",  "Beverages",true},
        });

        addMenuItems(r12, new Object[][]{
            {"Grilled Fish",         "Fresh catch with lemon butter",           "450", "Seafood",  false},
            {"Prawn Masala",         "Spicy Goan prawn curry",                  "520", "Seafood",  false},
            {"Fish Curry Rice",      "Goan fish curry with steamed rice",       "380", "Mains",    false},
            {"Bebinca",              "Traditional Goan layered dessert",        "180", "Desserts", true},
        });

        addMenuItems(r13, new Object[][]{
            {"Acai Bowl",            "Acai berries with granola and fruits",    "220", "Bowls",    true},
            {"Green Smoothie",       "Spinach, banana, almond milk",            "160", "Beverages",true},
            {"Quinoa Salad",         "Quinoa with roasted veggies",             "240", "Bowls",    true},
            {"Avocado Toast",        "Sourdough with smashed avocado",          "200", "Breakfast",true},
        });

        // ── Reviews ──────────────────────────────────────────────────────────
        addReview(c1, r1, 5, "Best biryani in Nanded! Authentic flavours.");
        addReview(c2, r1, 4, "Great taste, slightly long wait time.");
        addReview(c1, r2, 5, "Love the cold coffee here, perfect ambiance!");
        addReview(c2, r2, 4, "Nice cafe, sandwiches are fresh.");
        addReview(c1, r5, 5, "Wood-fired pizza is absolutely amazing!");
        addReview(c2, r6, 5, "Best dosa I've had outside Chennai!");
        addReview(c1, r8, 5, "Hyderabadi biryani is unmatched. Must visit!");
        addReview(c2, r4, 4, "Butter chicken was rich and creamy.");

        log.info("Seeded 13 restaurants with menus and reviews");
    }

    private Restaurant make(User owner, String name, String desc, String cuisine,
                            String address, String city, String pincode,
                            double lat, double lng, String phone,
                            double deliveryFee, double minOrder, int deliveryMins,
                            double rating, int totalRatings,
                            String logoUrl, String bannerUrl) {
        Restaurant r = new Restaurant();
        r.setOwner(owner);
        r.setName(name);
        r.setDescription(desc);
        r.setCuisineType(cuisine);
        r.setAddress(address);
        r.setCity(city);
        r.setPincode(pincode);
        r.setLatitude(lat);
        r.setLongitude(lng);
        r.setPhone(phone);
        r.setDeliveryFee(deliveryFee);
        r.setMinOrderAmount(minOrder);
        r.setAvgDeliveryTimeMinutes(deliveryMins);
        r.setAvgRating(rating);
        r.setTotalRatings(totalRatings);
        r.setLogoUrl(logoUrl);
        r.setBannerUrl(bannerUrl);
        r.setStatus(RestaurantStatus.APPROVED);
        r.setActive(true);
        r.setOpen(true);
        r.setOpenTime(LocalTime.of(9, 0));
        r.setCloseTime(LocalTime.of(23, 0));
        return restaurantRepository.save(r);
    }

    private void addMenuItems(Restaurant r, Object[][] items) {
        for (Object[] d : items) {
            MenuItem m = new MenuItem();
            m.setRestaurant(r);
            m.setName((String) d[0]);
            m.setDescription((String) d[1]);
            m.setPrice(new BigDecimal((String) d[2]));
            m.setCategory((String) d[3]);
            m.setVeg((boolean) d[4]);
            m.setAvailable(true);
            menuItemRepository.save(m);
        }
    }

    private void addReview(User customer, Restaurant restaurant, int rating, String comment) {
        if (reviewRepository.findByCustomerIdAndRestaurantId(customer.getId(), restaurant.getId()).isPresent())
            return;
        Review rev = new Review();
        rev.setCustomer(customer);
        rev.setRestaurant(restaurant);
        rev.setRating(rating);
        rev.setComment(comment);
        reviewRepository.save(rev);
    }
}
