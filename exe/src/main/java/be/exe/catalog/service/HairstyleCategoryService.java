package be.exe.catalog.service;

import be.exe.catalog.dto.request.CreateHairstyleCategoryRequest;
import be.exe.catalog.dto.response.HairstyleCategoryResponse;

import java.util.List;

public interface HairstyleCategoryService {

    HairstyleCategoryResponse createCategory(CreateHairstyleCategoryRequest request);

    List<HairstyleCategoryResponse> getAllCategories();
}
