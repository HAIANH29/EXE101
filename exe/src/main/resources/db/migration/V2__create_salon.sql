CREATE TABLE salons (
                        id BIGSERIAL PRIMARY KEY,
                        owner_id BIGINT NOT NULL,
                        name VARCHAR(200) NOT NULL,
                        phone VARCHAR(20),
                        address TEXT,
                        description TEXT,
                        image_url TEXT,
                        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                        CONSTRAINT fk_salons_owner
                            FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE stylists (
                          id BIGSERIAL PRIMARY KEY,
                          user_id BIGINT NOT NULL UNIQUE,
                          salon_id BIGINT NOT NULL,
                          bio TEXT,
                          experience_years INTEGER,
                          status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_stylists_user
                              FOREIGN KEY (user_id) REFERENCES users(id),

                          CONSTRAINT fk_stylists_salon
                              FOREIGN KEY (salon_id) REFERENCES salons(id)
);

CREATE TABLE salon_business_hours (
                                      id BIGSERIAL PRIMARY KEY,
                                      salon_id BIGINT NOT NULL,
                                      day_of_week SMALLINT NOT NULL,
                                      open_time TIME,
                                      close_time TIME,
                                      is_closed BOOLEAN NOT NULL DEFAULT FALSE,

                                      CONSTRAINT fk_business_hours_salon
                                          FOREIGN KEY (salon_id) REFERENCES salons(id),

                                      CONSTRAINT uq_salon_day
                                          UNIQUE (salon_id, day_of_week)
);