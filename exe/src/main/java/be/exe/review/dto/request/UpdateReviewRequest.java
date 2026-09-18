package be.exe.review.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateReviewRequest {

    @NotNull(message = "Đánh giá không được để trống")
    @Min(1)
    @Max(5)
    private Short rating;

    @Size(max = 2000)
    private String comment;

    public Short getRating() {
        return rating;
    }

    public void setRating(Short rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
