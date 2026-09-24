FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Basket.API/Basket.API.csproj", "Basket.API/"]
COPY ["EventBus.Messages/EventBus.Messages.csproj", "EventBus.Messages/"]
RUN dotnet restore "Basket.API/Basket.API.csproj"
COPY Basket.API/ Basket.API/
COPY EventBus.Messages/ EventBus.Messages/
WORKDIR "/src/Basket.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=15s \
    CMD curl -f http://localhost/health || exit 1
ENTRYPOINT ["dotnet", "Basket.API.dll"]
