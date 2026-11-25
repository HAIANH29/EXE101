FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

RUN mkdir -p /root/.m2 && printf '<settings>\n\
  <mirrors>\n\
    <mirror>\n\
      <id>google-maven-central</id>\n\
      <name>Google Maven Central Mirror</name>\n\
      <url>https://maven-central.storage-download.googleapis.com/maven2/</url>\n\
      <mirrorOf>central</mirrorOf>\n\
    </mirror>\n\
  </mirrors>\n\
</settings>\n' > /root/.m2/settings.xml

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy AS runtime

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app app \
    && mkdir -p /app/uploads /var/log/salon-backend \
    && chown -R app:app /app /var/log/salon-backend

COPY --from=build --chown=app:app /app/target/*.jar /app/app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

EXPOSE 8080

USER app

ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS} -jar /app/app.jar"]
