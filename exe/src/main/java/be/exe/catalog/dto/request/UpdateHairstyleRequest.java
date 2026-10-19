package be.exe.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class UpdateHairstyleRequest {

    @NotBlank
    private String name;

    private String description;

    @NotBlank
    private String imageUrl;

    /** Gallery ảnh (tối đa 5), thay thế toàn bộ gallery cũ. Ảnh đầu tiên là ảnh bìa. */
    private List<String> imageUrls;

    private Long categoryId;

    private String gender;

    private String status; // ACTIVE / INACTIVE

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
