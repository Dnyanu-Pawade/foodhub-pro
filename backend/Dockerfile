FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN apk add --no-cache maven && mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S foodhub && adduser -S foodhub -G foodhub
COPY --from=build /app/target/foodhub-pro-1.0.0.jar app.jar
RUN chown foodhub:foodhub app.jar
USER foodhub
EXPOSE 8082
ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "app.jar"]
