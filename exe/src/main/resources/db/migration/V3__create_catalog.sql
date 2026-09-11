CREATE TABLE services (
                          id BIGSERIAL PRIMARY KEY,
                          salon_id BIGINT NOT NULL,
                          name VARCHAR(200) NOT NULL,
                          description TEXT,
                          price NUMERIC(12,2) NOT NULL,
                          duration_minutes INTEGER NOT NULL,
                          status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_services_salon
                              FOREIGN KEY (salon_id) REFERENCES salons(id),

                          CONSTRAINT chk_services_price
                              CHECK (price >= 0),

                          CONSTRAINT chk_services_duration
                              CHECK (duration_minutes > 0)
);

CREATE TABLE hairstyle_categories (
                                      id BIGSERIAL PRIMARY KEY,
                                      name VARCHAR(100) NOT NULL UNIQUE,
                                      description TEXT
);

CREATE TABLE hairstyles (
                            id BIGSERIAL PRIMARY KEY,
                            category_id BIGINT,
                            name VARCHAR(200) NOT NULL,
                            description TEXT,
                            image_url TEXT NOT NULL,
                            gender VARCHAR(20),
                            status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT fk_hairstyles_category
                                FOREIGN KEY (category_id)
                                    REFERENCES hairstyle_categories(id)
);

CREATE TABLE salon_hairstyles (
                                  salon_id BIGINT NOT NULL,
                                  hairstyle_id BIGINT NOT NULL,

                                  PRIMARY KEY (salon_id, hairstyle_id),

                                  CONSTRAINT fk_salon_hairstyles_salon
                                      FOREIGN KEY (salon_id) REFERENCES salons(id),

                                  CONSTRAINT fk_salon_hairstyles_hairstyle
                                      FOREIGN KEY (hairstyle_id) REFERENCES hairstyles(id)
);
