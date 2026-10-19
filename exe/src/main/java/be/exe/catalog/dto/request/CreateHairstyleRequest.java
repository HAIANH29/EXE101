package be.exe.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class CreateHairstyleRequest {

    @NotBlank(message = "Tên kiểu tóc không được để trống")
    private String name;

    private String description;

    @NotBlank(message = "Ảnh minh họa không được để trống")
    private String imageUrl;

    /** Gallery ảnh (tối đa 5). Nếu có, ảnh đầu tiên được dùng làm ảnh bìa thay cho imageUrl. */
    private List<String> imageUrls;

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
}
