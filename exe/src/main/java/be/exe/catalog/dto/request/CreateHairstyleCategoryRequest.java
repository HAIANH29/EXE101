package be.exe.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateHairstyleCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    private String name;

    private String description;

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
}
