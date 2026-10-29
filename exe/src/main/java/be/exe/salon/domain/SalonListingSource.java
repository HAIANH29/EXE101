package be.exe.salon.domain;

/**
 * Describes who supplied a salon listing. It deliberately does not imply that
 * a real-world salon has entered a partnership with StyleLock.
 */
public enum SalonListingSource {
    OWNER_SUBMITTED,
    GEOAPIFY_DEMO,
    PLATFORM_CURATED
}
