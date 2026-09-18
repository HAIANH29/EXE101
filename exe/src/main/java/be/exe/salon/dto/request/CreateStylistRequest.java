package be.exe.salon.dto.request;

import jakarta.validation.constraints.NotNull;

public class CreateStylistRequest {

    @NotNull(message = "userId không được để trống")
    private Long userId;

    private String bio;
    private Integer experienceYears;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }
}
