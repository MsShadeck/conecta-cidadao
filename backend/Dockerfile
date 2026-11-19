# Imagem da API para o Render (ou qualquer serviço que rode Docker).
# 1) Compila com o Maven Wrapper do projeto; 2) roda só o .jar numa imagem menor (JRE).
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B -DskipTests package && cp target/conecta-cidadao-api-*.jar app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
# Usuário sem privilégios: a API não precisa de root.
RUN useradd --system --uid 1001 api
USER api
COPY --from=build /app/app.jar app.jar
# O plano gratuito tem 512 MB: a JVM usa até 75% disso. A porta vem da variável PORT do Render.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
