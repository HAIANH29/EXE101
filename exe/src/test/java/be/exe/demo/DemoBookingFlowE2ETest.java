package be.exe.demo;

import be.exe.auth.domain.Role;
import be.exe.auth.domain.RoleName;
import be.exe.auth.domain.User;
import be.exe.auth.repository.RoleRepository;
import be.exe.auth.repository.UserRepository;
import be.exe.booking.repository.BookingRepository;
import be.exe.payment.repository.PaymentRepository;
import be.exe.salon.repository.SalonRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DemoBookingFlowE2ETest {

    private static final String CUSTOMER_EMAIL = "demo.customer.e2e@stylelock.local";
    private static final String CUSTOMER_PASSWORD = "DemoCustomer123!";
    private static final String ADMIN_EMAIL = "demo.admin.e2e@stylelock.local";
    private static final String ADMIN_PASSWORD = "DemoAdmin123!";
    private static final String PLACE_ID = "geoapify-e2e-place-001";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired SalonRepository salonRepository;
    @Autowired BookingRepository bookingRepository;
    @Autowired PaymentRepository paymentRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void prepareCustomer() {
        if (userRepository.findByEmail(CUSTOMER_EMAIL).isEmpty()) {
            Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                    .orElseGet(() -> roleRepository.saveAndFlush(new Role(RoleName.CUSTOMER)));
            User customer = new User(CUSTOMER_EMAIL, passwordEncoder.encode(CUSTOMER_PASSWORD),
                    "Demo E2E Customer");
            customer.addRole(customerRole);
            userRepository.saveAndFlush(customer);
        }

        if (userRepository.findByEmail(ADMIN_EMAIL).isEmpty()) {
            Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                    .orElseGet(() -> roleRepository.saveAndFlush(new Role(RoleName.ADMIN)));
            User admin = new User(ADMIN_EMAIL, passwordEncoder.encode(ADMIN_PASSWORD),
                    "Demo E2E Admin");
            admin.addRole(adminRole);
            userRepository.saveAndFlush(admin);
        }
    }

    @Test
    void customerToBookingToOwnerToPayment_isPersistedEndToEnd() throws Exception {
        String customerToken = login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);

        String materializeJson = """
                {
                  "placeId":"geoapify-e2e-place-001",
                  "name":"Salon Thật Geoapify E2E",
                  "address":"Nguyễn Trãi, Quận 5, TP.HCM",
                  "phone":"0900000000",
                  "latitude":10.754,
                  "longitude":106.663
                }
                """;
        JsonNode firstMaterialize = performJson(post("/api/demo/salons/materialize")
                .header("Authorization", bearer(customerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(materializeJson), 201);
        long salonId = firstMaterialize.path("data").path("id").asLong();
        assertThat(firstMaterialize.path("data").path("demo").asBoolean()).isTrue();

        JsonNode secondMaterialize = performJson(post("/api/demo/salons/materialize")
                .header("Authorization", bearer(customerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(materializeJson), 201);
        assertThat(secondMaterialize.path("data").path("id").asLong()).isEqualTo(salonId);
        assertThat(salonRepository.findByGeoapifyPlaceId(PLACE_ID)).isPresent();

        JsonNode services = performJson(get("/api/salons/{salonId}/services", salonId), 200);
        JsonNode stylists = performJson(get("/api/salons/{salonId}/stylists", salonId), 200);
        JsonNode salonDetail = performJson(get("/api/salons/{salonId}", salonId), 200);
        long serviceId = services.path("data").path("content").get(0).path("id").asLong();
        long stylistId = stylists.path("data").path("content").get(0).path("id").asLong();
        assertThat(services.path("data").path("content").size()).isGreaterThanOrEqualTo(3);
        assertThat(stylists.path("data").path("content").size()).isGreaterThanOrEqualTo(1);
        assertThat(salonDetail.path("data").path("businessHours").size()).isEqualTo(7);

        ZoneId vietnam = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant startAt = LocalDate.now(vietnam).plusDays(2)
                .atTime(10, 0).atZone(vietnam).toInstant();
        String bookingJson = """
                {"salonId":%d,"stylistId":%d,"serviceId":%d,"startAt":"%s","note":"E2E demo booking"}
                """.formatted(salonId, stylistId, serviceId, startAt);
        JsonNode booking = performJson(post("/api/bookings")
                .header("Authorization", bearer(customerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson), 201);
        long bookingId = booking.path("data").path("id").asLong();
        assertThat(bookingRepository.findById(bookingId)).isPresent();

        JsonNode customerHistory = performJson(get("/api/bookings/me")
                .header("Authorization", bearer(customerToken)), 200);
        assertThat(containsId(customerHistory.path("data").path("content"), bookingId)).isTrue();

        String ownerToken = login("demo.owner@stylelock.local", "DemoOwner123!");
        JsonNode ownerBookings = performJson(get("/api/bookings/salon/{salonId}", salonId)
                .header("Authorization", bearer(ownerToken)), 200);
        assertThat(containsId(ownerBookings.path("data").path("content"), bookingId)).isTrue();
        JsonNode confirmedBooking = performJson(patch("/api/bookings/{bookingId}/confirm", bookingId)
                .header("Authorization", bearer(ownerToken)), 200);
        assertThat(confirmedBooking.path("data").path("status").asText()).isEqualTo("CONFIRMED");

        JsonNode payment = performJson(get("/api/bookings/{bookingId}/payment", bookingId)
                .header("Authorization", bearer(customerToken)), 200);
        long paymentId = payment.path("data").path("id").asLong();
        assertThat(payment.path("data").path("provider").asText()).isEqualTo("DEMO");
        assertThat(payment.path("data").path("status").asText()).isEqualTo("PENDING");
        assertThat(payment.path("data").path("paymentUrl").isNull()).isTrue();

        JsonNode paid = performJson(post("/api/demo/payments/{paymentId}/confirm", paymentId)
                .header("Authorization", bearer(customerToken)), 200);
        assertThat(paid.path("data").path("status").asText()).isEqualTo("PAID");
        assertThat(paymentRepository.findById(paymentId).orElseThrow().isPaid()).isTrue();

        JsonNode paymentHistory = performJson(get("/api/payments/history")
                .header("Authorization", bearer(customerToken)), 200);
        assertThat(containsId(paymentHistory.path("data").path("content"), paymentId)).isTrue();

        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        JsonNode adminPayments = performJson(get("/api/admin/payments")
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminToken)), 200);
        assertThat(containsId(adminPayments.path("data").path("content"), paymentId)).isTrue();

        JsonNode paidUsers = performJson(get("/api/admin/payments/paid-users")
                .param("page", "0")
                .param("size", "10")
                .header("Authorization", bearer(adminToken)), 200);
        long customerId = userRepository.findByEmail(CUSTOMER_EMAIL).orElseThrow().getId();
        assertThat(containsCustomerId(paidUsers.path("data").path("content"), customerId)).isTrue();

        JsonNode adminPaymentDetail = performJson(get("/api/admin/payments/{paymentId}", paymentId)
                .header("Authorization", bearer(adminToken)), 200);
        assertThat(adminPaymentDetail.path("data").path("id").asLong()).isEqualTo(paymentId);

        JsonNode version = performJson(get("/api/public/version"), 200);
        assertThat(version.path("data").path("gitCommit").asText()).isNotBlank();

        mockMvc.perform(get("/api/route-that-does-not-exist")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNotFound());

        JsonNode completedBooking = performJson(patch("/api/bookings/{bookingId}/complete", bookingId)
                .header("Authorization", bearer(ownerToken)), 200);
        assertThat(completedBooking.path("data").path("status").asText()).isEqualTo("COMPLETED");
    }

    private String login(String email, String password) throws Exception {
        JsonNode response = performJson(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(java.util.Map.of(
                        "email", email, "password", password))), 200);
        return response.path("data").path("accessToken").asText();
    }

    private JsonNode performJson(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
                                 int expectedStatus) throws Exception {
        var result = mockMvc.perform(request)
                .andExpect(status().is(expectedStatus))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private boolean containsId(JsonNode items, long id) {
        for (JsonNode item : items) {
            if (item.path("id").asLong() == id) return true;
        }
        return false;
    }

    private boolean containsCustomerId(JsonNode items, long customerId) {
        for (JsonNode item : items) {
            if (item.path("customerId").asLong() == customerId) return true;
        }
        return false;
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
