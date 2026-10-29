# ── Build stage ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
# Pré-télécharge les dépendances (cache Docker)
RUN ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar -x test

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app
# Utilisateur non-root
RUN useradd -r -u 1001 appuser
COPY --from=build /app/build/libs/*.jar app.jar
# Répertoire de stockage persistant (monté en volume en production)
RUN mkdir -p /data/uploads && chown -R appuser:appuser /data
ENV UPLOAD_DIR=/data/uploads
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
