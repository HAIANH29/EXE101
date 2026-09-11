package be.exe.catalog.service.impl;

import be.exe.catalog.domain.HairstyleCategory;
import be.exe.catalog.dto.request.CreateHairstyleCategoryRequest;
import be.exe.catalog.dto.response.HairstyleCategoryResponse;
import be.exe.catalog.mapper.HairstyleMapper;
import be.exe.catalog.repository.HairstyleCategoryRepository;
import be.exe.catalog.service.HairstyleCategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class HairstyleCategoryServiceImpl implements HairstyleCategoryService {

    private final HairstyleCategoryRepository categoryRepository;

    public HairstyleCategoryServiceImpl(HairstyleCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public HairstyleCategoryResponse createCategory(CreateHairstyleCategoryRequest request) {
        HairstyleCategory entity = new HairstyleCategory(request.getName(), request.getDescription());
        categoryRepository.save(entity);
        return HairstyleMapper.toCategoryResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HairstyleCategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(HairstyleMapper::toCategoryResponse)
                .toList();
    }
}
