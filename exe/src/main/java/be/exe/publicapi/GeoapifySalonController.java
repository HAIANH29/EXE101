package be.exe.publicapi;

import be.exe.common.response.ApiResponse;
import be.exe.publicapi.dto.ExternalSalonResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/salons")
public class GeoapifySalonController {

    private final GeoapifySalonService geoapifySalonService;

    public GeoapifySalonController(GeoapifySalonService geoapifySalonService) {
        this.geoapifySalonService = geoapifySalonService;
    }

    @GetMapping("/nearby")
    public ApiResponse<List<ExternalSalonResponse>> nearbySalons(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Integer radius) {
        return ApiResponse.success(geoapifySalonService.searchSalons(query, latitude, longitude, radius));
    }
}
