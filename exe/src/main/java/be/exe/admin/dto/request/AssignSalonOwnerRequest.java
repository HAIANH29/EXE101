package be.exe.admin.dto.request;

import jakarta.validation.Valid;

public class AssignSalonOwnerRequest {

    private Long ownerId;

    @Valid
    private CreateSalonOwnerRequest createOwner;

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public CreateSalonOwnerRequest getCreateOwner() {
        return createOwner;
    }

    public void setCreateOwner(CreateSalonOwnerRequest createOwner) {
        this.createOwner = createOwner;
    }
}
