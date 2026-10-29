package be.exe.publicapi;

import be.exe.common.exception.BusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeoapifySalonServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void parseSalons_mapsGeoapifyFeatureAndComputesMissingDistance() throws Exception {
        var service = new GeoapifySalonService(RestClient.builder(), "test-key");
        var response = objectMapper.readTree("""
                {
                  "features": [{
                    "properties": {
                      "place_id": "salon-123",
                      "name": "Salon Ánh Dương",
                      "formatted": "1 Nguyễn Huệ, Quận 1, TP.HCM",
                      "lat": 10.777,
                      "lon": 106.701,
                      "opening_hours": "Mo-Su 08:00-20:00",
                      "contact": {"phone": "+84 28 1234 5678"},
                      "datasource": {"raw": {"website": "https://example.com"}}
                    }
                  }]
                }
                """);

        var salons = service.parseSalons(
                response, GeoapifySalonService.DEFAULT_LATITUDE,
                GeoapifySalonService.DEFAULT_LONGITUDE);

        assertThat(salons).singleElement().satisfies(salon -> {
            assertThat(salon.placeId()).isEqualTo("salon-123");
            assertThat(salon.name()).isEqualTo("Salon Ánh Dương");
            assertThat(salon.phone()).isEqualTo("+84 28 1234 5678");
            assertThat(salon.distanceMeters()).isGreaterThanOrEqualTo(0);
            assertThat(salon.mapUrl()).contains("openstreetmap.org");
            assertThat(salon.website()).isEqualTo("https://example.com");
        });
    }

    @Test
    void parseSalons_skipsFeaturesWithoutCoordinates() throws Exception {
        var service = new GeoapifySalonService(RestClient.builder(), "test-key");
        var response = objectMapper.readTree("""
                {"features":[{"properties":{
                  "place_id":"1","name":"Tóc Đẹp","formatted":"Quận Ba Đình, Hà Nội",
                  "lat":21.034,"lon":105.814
                }}]}
                """);

        var invalidResponse = objectMapper.readTree("""
                {"features":[{"properties":{"place_id":"2","name":"Thiếu tọa độ"}}]}
                """);

        assertThat(service.parseSalons(response, 21.03, 105.81)).hasSize(1);
        assertThat(service.parseSalons(invalidResponse, 21.03, 105.81)).isEmpty();
    }

    @Test
    void searchSalons_rejectsMissingApiKeyAndInvalidCoordinatesBeforeNetworkCall() {
        var noKeyService = new GeoapifySalonService(RestClient.builder(), " ");
        var service = new GeoapifySalonService(RestClient.builder(), "test-key");

        assertThatThrownBy(() -> noKeyService.searchSalons(null, null, null, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("GEOAPIFY_API_KEY");
        assertThatThrownBy(() -> service.searchSalons(null, 91D, 106D, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tọa độ");
    }

    @Test
    void searchSalons_buildsAbsoluteGeoapifyPlacesRequestFromBaseUrl() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new GeoapifySalonService(builder, "test-key");

        server.expect(request -> {
                    assertThat(request.getURI().isAbsolute()).isTrue();
                    assertThat(request.getURI().getHost()).isEqualTo("api.geoapify.com");
                    assertThat(request.getURI().getPath()).isEqualTo("/v2/places");
                    assertThat(request.getURI().getRawQuery())
                            .contains("categories=service.beauty.hairdresser")
                            .contains("filter=circle:")
                            .contains("bias=proximity:")
                            .contains("apiKey=test-key");
                })
                .andRespond(withSuccess("{\"features\":[]}", MediaType.APPLICATION_JSON));

        assertThat(service.searchSalons(null, 10.7769, 106.7009, 5_000)).isEmpty();
        server.verify();
    }

    @Test
    void searchSalons_geocodesVietnameseTextBeforeSearchingNearbyPlaces() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new GeoapifySalonService(builder, "test-key");

        server.expect(request -> {
                    assertThat(request.getURI().getPath()).isEqualTo("/v1/geocode/search");
                    assertThat(request.getURI().getRawQuery())
                            .contains("filter=countrycode:vn")
                            .contains("format=json");
                })
                .andRespond(withSuccess(
                        "{\"results\":[{\"lat\":10.754,\"lon\":106.663}]}",
                        MediaType.APPLICATION_JSON));
        server.expect(request -> {
                    assertThat(request.getURI().getPath()).isEqualTo("/v2/places");
                    assertThat(request.getURI().getRawQuery())
                            .contains("circle:106.663,10.754");
                })
                .andRespond(withSuccess("{\"features\":[]}", MediaType.APPLICATION_JSON));

        assertThat(service.searchSalons("Nguyễn Trãi, Quận 5", null, null, 5_000)).isEmpty();
        server.verify();
    }
}
