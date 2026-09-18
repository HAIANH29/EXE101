package be.exe.catalog.controller;

import be.exe.catalog.dto.request.CreateHairstyleCategoryRequest;
import be.exe.catalog.dto.response.HairstyleCategoryResponse;
import be.exe.catalog.service.HairstyleCategoryService;
import be.exe.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/hairstyle-categories")
public class HairstyleCategoryController {

    private final HairstyleCategoryService categoryService;

    public HairstyleCategoryController(HairstyleCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HairstyleCategoryResponse>> createCategory(
            @Valid @RequestBody CreateHairstyleCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.createCategory(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HairstyleCategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories()));
    }
}
