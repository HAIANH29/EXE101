package be.exe.publicapi;

import be.exe.publicapi.dto.SalonDirectoryEntry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SalonDirectoryControllerTest {

    @Autowired
    private SalonDirectoryController controller;

    @Test
    void directoryReturnsOnlyActiveSalonsWithNonNullCollections() {
        List<SalonDirectoryEntry> entries = controller.directory().getData();

        assertNotNull(entries);
        for (SalonDirectoryEntry entry : entries) {
            assertNotNull(entry.salon());
            assertEquals("ACTIVE", entry.salon().status());
            assertNotNull(entry.services());
            assertNotNull(entry.stylists());
            assertNotNull(entry.hairstyles());
        }
        assertTrue(entries.size() <= 100);
    }
}
