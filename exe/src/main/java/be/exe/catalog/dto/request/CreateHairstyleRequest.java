package be.exe.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateHairstyleRequest {

    @NotBlank(message = "Tên kiểu tóc không được để trống")
    private String name;

    private String description;

    @NotBlank(message = "Ảnh minh họa không được để trống")
    private String imageUrl;

    private Long categoryId;

    private String gender; // MALE / FEMALE / UNISEX

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
}
