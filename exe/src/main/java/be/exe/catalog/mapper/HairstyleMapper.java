package be.exe.catalog.mapper;

import be.exe.catalog.domain.Hairstyle;
import be.exe.catalog.domain.HairstyleCategory;
import be.exe.catalog.dto.response.HairstyleCategoryResponse;
import be.exe.catalog.dto.response.HairstyleResponse;
import be.exe.catalog.dto.response.HairstyleSummaryResponse;

import java.util.List;

public final class HairstyleMapper {

    private HairstyleMapper() {
    }

    public static HairstyleResponse toResponse(Hairstyle entity, List<String> imageUrls) {
        return new HairstyleResponse(
                entity.getId(),
                entity.getCategoryId(),
                entity.getName(),
                entity.getDescription(),
                entity.getImageUrl(),
                imageUrls,
                entity.getGender() != null ? entity.getGender().name() : null,
                entity.getStatus().name(),
                entity.getCreatedAt()
        );
    }

    public static HairstyleSummaryResponse toSummary(Hairstyle entity) {
        return new HairstyleSummaryResponse(
                entity.getId(), entity.getName(), entity.getImageUrl(), entity.getStatus().name());
    }

    public static HairstyleCategoryResponse toCategoryResponse(HairstyleCategory entity) {
        return new HairstyleCategoryResponse(entity.getId(), entity.getName(), entity.getDescription());
    }
}
