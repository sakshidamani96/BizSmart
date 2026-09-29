# =============================================================================
# BizSmart - single container: React UI + Spring Boot API on one port.
# Used by render.yaml (runtime: docker). Build locally with:  docker build -t bizsmart .
# =============================================================================

# ---- 1. Build the React frontend -------------------------------------------
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# "/" = same-origin API: the UI calls /api/... on the service that serves it
ENV VITE_API_BASE_URL=/
RUN npm run build

# ---- 2. Build the Spring Boot backend (with the UI bundled as static files) -
FROM maven:3.9.6-eclipse-temurin-17 AS backend
WORKDIR /app
COPY backend/pom.xml ./pom.xml
RUN mvn -B -q dependency:go-offline || true
COPY backend/src ./src
COPY --from=frontend /frontend/dist ./src/main/resources/static
RUN mvn -B clean package -DskipTests

# ---- 3. Minimal runtime image -----------------------------------------------
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN groupadd -r bizsmart && useradd -r -g bizsmart bizsmart
COPY --from=backend /app/target/bizsmart.jar app.jar
USER bizsmart

# Render injects PORT; Spring reads it via server.port=${PORT:8080}
ENV PORT=8080
EXPOSE 8080

# Tuned for 512 MB free-tier instances: SerialGC has the smallest footprint,
# TieredStopAtLevel=1 speeds up cold starts after the free service sleeps.
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=70.0", \
  "-XX:+UseSerialGC", \
  "-XX:TieredStopAtLevel=1", \
  "-Xss512k", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
