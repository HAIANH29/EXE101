package be.exe.common.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Chuẩn hóa việc tạo Pageable từ tham số page/size/sort trên query string,
 * tránh mỗi Controller tự viết logic parse khác nhau.
 */
public final class PaginationUtils {

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 10;
    public static final int MAX_SIZE = 100;

    private PaginationUtils() {
    }

    public static Pageable of(Integer page, Integer size) {
        return of(page, size, null, null);
    }

    public static Pageable of(Integer page, Integer size, String sortBy, String sortDirection) {
        int safePage = (page == null || page < 0) ? DEFAULT_PAGE : page;
        int safeSize = (size == null || size <= 0) ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);

        if (sortBy == null || sortBy.isBlank()) {
            return PageRequest.of(safePage, safeSize);
        }

        Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        return PageRequest.of(safePage, safeSize, Sort.by(direction, sortBy));
    }
}
