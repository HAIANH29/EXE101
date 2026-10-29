package be.exe.publicapi;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.publicapi.dto.ExternalSalonResponse;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;

@Service
public class GeoapifySalonService {

    static final double DEFAULT_LATITUDE = 10.7769;
    static final double DEFAULT_LONGITUDE = 106.7009;
    private static final int DEFAULT_RADIUS_METERS = 10_000;
    private static final int MAX_RADIUS_METERS = 50_000;
    private static final int RESULT_LIMIT = 20;
    private static final double VIETNAM_MIN_LATITUDE = 8.0;
    private static final double VIETNAM_MAX_LATITUDE = 24.0;
    private static final double VIETNAM_MIN_LONGITUDE = 102.0;
    private static final double VIETNAM_MAX_LONGITUDE = 110.0;
    private static final int PLACE_COORDINATE_TOLERANCE_METERS = 100;

    private final RestClient restClient;
    private final String apiKey;

    public GeoapifySalonService(RestClient.Builder restClientBuilder,
                                @Value("${app.geoapify.api-key:}") String apiKey) {
        this.restClient = restClientBuilder.baseUrl("https://api.geoapify.com").build();
        this.apiKey = apiKey;
    }

    public List<ExternalSalonResponse> searchSalons(String query, Double latitude,
                                                     Double longitude, Integer radius) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Chưa cấu hình GEOAPIFY_API_KEY cho dịch vụ tìm salon");
        }

        SearchCoordinates coordinates = query != null && !query.isBlank()
                ? geocodeVietnameseLocation(query.trim())
                : new SearchCoordinates(
                        latitude == null ? DEFAULT_LATITUDE : latitude,
                        longitude == null ? DEFAULT_LONGITUDE : longitude);
        if (coordinates == null) {
            return List.of();
        }
        double resolvedLatitude = coordinates.latitude();
        double resolvedLongitude = coordinates.longitude();
        validateCoordinates(resolvedLatitude, resolvedLongitude);
        int resolvedRadius = radius == null
                ? DEFAULT_RADIUS_METERS
                : Math.max(100, Math.min(radius, MAX_RADIUS_METERS));

        JsonNode response;
        try {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v2/places")
                            .queryParam("categories", "service.beauty.hairdresser")
                            .queryParam("filter", "circle:%s,%s,%d".formatted(
                                    resolvedLongitude, resolvedLatitude, resolvedRadius))
                            .queryParam("bias", "proximity:%s,%s".formatted(
                                    resolvedLongitude, resolvedLatitude))
                            .queryParam("limit", RESULT_LIMIT)
                            .queryParam("apiKey", apiKey)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Không thể lấy danh sách salon từ Geoapify");
        }

        return parseSalons(response, resolvedLatitude, resolvedLongitude);
    }

    public ValidatedSalonPlace validateSalonPlace(String requestedPlaceId,
                                                   Double submittedLatitude,
                                                   Double submittedLongitude) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Chưa cấu hình GEOAPIFY_API_KEY để xác minh địa điểm salon");
        }
        if (requestedPlaceId == null || requestedPlaceId.isBlank()
                || submittedLatitude == null || submittedLongitude == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Liên kết Geoapify phải có Place ID và tọa độ");
        }

        JsonNode response;
        try {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v2/place-details")
                            .queryParam("id", requestedPlaceId.trim())
                            .queryParam("apiKey", apiKey)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().is4xxClientError()) {
                throw invalidSalonPlace();
            }
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Không thể xác minh địa điểm salon với Geoapify");
        } catch (RestClientException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Không thể xác minh địa điểm salon với Geoapify");
        }

        JsonNode features = response == null ? null : response.path("features");
        if (features == null || !features.isArray() || features.isEmpty()) {
            throw invalidSalonPlace();
        }
        JsonNode properties = features.get(0).path("properties");
        String canonicalPlaceId = text(properties, "place_id").trim();
        String name = text(properties, "name").trim();
        String address = firstNonBlank(text(properties, "formatted"), joinAddress(properties));
        String countryCode = text(properties, "country_code").trim();
        double canonicalLatitude = number(properties, "lat", Double.NaN);
        double canonicalLongitude = number(properties, "lon", Double.NaN);

        boolean validCategory = false;
        JsonNode categories = properties.path("categories");
        if (categories.isArray()) {
            for (JsonNode category : categories) {
                if ("service.beauty.hairdresser".equals(category.asText())) {
                    validCategory = true;
                    break;
                }
            }
        }

        if (canonicalPlaceId.isBlank() || name.isBlank() || address.isBlank()
                || !"vn".equalsIgnoreCase(countryCode)
                || !validCategory
                || !isWithinVietnamBounds(canonicalLatitude, canonicalLongitude)
                || !Double.isFinite(submittedLatitude) || !Double.isFinite(submittedLongitude)
                || distanceMeters(canonicalLatitude, canonicalLongitude,
                        submittedLatitude, submittedLongitude) > PLACE_COORDINATE_TOLERANCE_METERS) {
            throw invalidSalonPlace();
        }

        return new ValidatedSalonPlace(canonicalPlaceId, name, address,
                canonicalLatitude, canonicalLongitude);
    }

    private SearchCoordinates geocodeVietnameseLocation(String query) {
        JsonNode response;
        try {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/geocode/search")
                            .queryParam("text", query)
                            .queryParam("filter", "countrycode:vn")
                            .queryParam("lang", "vi")
                            .queryParam("limit", 1)
                            .queryParam("format", "json")
                            .queryParam("apiKey", apiKey)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Không thể xác định vị trí tìm kiếm từ Geoapify");
        }

        JsonNode results = response == null ? null : response.path("results");
        if (results == null || !results.isArray() || results.isEmpty()) {
            return null;
        }
        JsonNode first = results.get(0);
        double resolvedLatitude = number(first, "lat", Double.NaN);
        double resolvedLongitude = number(first, "lon", Double.NaN);
        if (!Double.isFinite(resolvedLatitude) || !Double.isFinite(resolvedLongitude)) {
            return null;
        }
        validateCoordinates(resolvedLatitude, resolvedLongitude);
        return new SearchCoordinates(resolvedLatitude, resolvedLongitude);
    }

    List<ExternalSalonResponse> parseSalons(JsonNode response,
                                             double originLatitude, double originLongitude) {
        List<ExternalSalonResponse> salons = new ArrayList<>();
        JsonNode features = response == null ? null : response.path("features");
        if (features == null || !features.isArray()) {
            return salons;
        }

        for (JsonNode feature : features) {
            JsonNode properties = feature.path("properties");
            String name = text(properties, "name").trim();
            String placeId = text(properties, "place_id").trim();
            String countryCode = text(properties, "country_code").trim();
            if (name.isBlank() || placeId.isBlank()
                    || !"vn".equalsIgnoreCase(countryCode)) {
                continue;
            }
            double latitude = number(properties, "lat", Double.NaN);
            double longitude = number(properties, "lon", Double.NaN);
            if (!isWithinVietnamBounds(latitude, longitude)) {
                continue;
            }

            String address = firstNonBlank(
                    text(properties, "formatted"),
                    joinAddress(properties),
                    "Địa chỉ đang cập nhật"
            );
            int distanceMeters = properties.path("distance").canConvertToInt()
                    ? Math.max(0, properties.path("distance").asInt())
                    : distanceMeters(originLatitude, originLongitude, latitude, longitude);
            salons.add(new ExternalSalonResponse(
                    placeId,
                    name,
                    address,
                    nestedText(properties, "contact", "phone"),
                    latitude,
                    longitude,
                    distanceMeters,
                    "https://www.openstreetmap.org/?mlat=%s&mlon=%s#map=18/%s/%s".formatted(
                            latitude, longitude, latitude, longitude),
                    text(properties, "opening_hours"),
                    firstNonBlank(
                            nestedText(properties, "datasource", "raw", "website"),
                            nestedText(properties, "contact", "website")
                    )
            ));
        }
        return salons;
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (!isWithinVietnamBounds(latitude, longitude)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Tọa độ tìm kiếm phải nằm trong Việt Nam");
        }
    }

    private boolean isWithinVietnamBounds(double latitude, double longitude) {
        return Double.isFinite(latitude)
                && latitude >= VIETNAM_MIN_LATITUDE && latitude <= VIETNAM_MAX_LATITUDE
                && Double.isFinite(longitude)
                && longitude >= VIETNAM_MIN_LONGITUDE && longitude <= VIETNAM_MAX_LONGITUDE;
    }

    private BusinessException invalidSalonPlace() {
        return new BusinessException(ErrorCode.VALIDATION_FAILED,
                "Place ID phải là salon tóc hợp lệ tại Việt Nam và có tọa độ khớp Geoapify");
    }

    private int distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        return (int) Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    private String joinAddress(JsonNode properties) {
        String line1 = text(properties, "address_line1");
        String line2 = text(properties, "address_line2");
        if (line1.isBlank()) return line2;
        if (line2.isBlank()) return line1;
        return line1 + ", " + line2;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? "" : value.asText("");
    }

    private String nestedText(JsonNode node, String... path) {
        JsonNode current = node;
        for (String field : path) {
            current = current == null ? null : current.get(field);
        }
        return current == null || current.isNull() ? "" : current.asText("");
    }

    private double number(JsonNode node, String field, double fallback) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || !value.isNumber() ? fallback : value.asDouble();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private record SearchCoordinates(double latitude, double longitude) {
    }

    public record ValidatedSalonPlace(
            String placeId,
            String name,
            String address,
            double latitude,
            double longitude
    ) {
    }

}
