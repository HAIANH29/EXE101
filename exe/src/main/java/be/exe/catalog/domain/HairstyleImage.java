package be.exe.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Một ảnh trong gallery của kiểu tóc. Ảnh có sort_order nhỏ nhất là ảnh bìa (= Hairstyle.imageUrl).
 */
@Entity
@Table(name = "hairstyle_images")
public class HairstyleImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hairstyle_id", nullable = false)
    private Long hairstyleId;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected HairstyleImage() {
    }

    public HairstyleImage(Long hairstyleId, String imageUrl, int sortOrder) {
        this.hairstyleId = hairstyleId;
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public Long getHairstyleId() {
        return hairstyleId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
