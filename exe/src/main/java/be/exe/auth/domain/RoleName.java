package be.exe.auth.domain;

/**
 * Khớp với dữ liệu đã INSERT sẵn trong V1__create_auth.sql.
 * KHÔNG tự ý đổi tên các giá trị này nếu không đồng thời sửa lại migration.
 */
public enum RoleName {
    CUSTOMER,
    STAFF,
    SALON_OWNER,
    ADMIN
}
