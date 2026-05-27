FROM gradle:jdk25-corretto AS builder

WORKDIR /workspace
COPY build.gradle settings.gradle ./
COPY src ./src

RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:25-jre

WORKDIR /app
COPY --from=builder /workspace/build/libs/*.jar /app/app.jar

EXPOSE 5010
ENTRYPOINT ["java", "-jar", "/app/app.jar", "--server.port=5010"]
