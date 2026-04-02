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
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "Basket.API.dll"]
