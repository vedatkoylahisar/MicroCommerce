FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Ordering.API/Ordering.API.csproj", "Ordering.API/"]
COPY ["EventBus.Messages/EventBus.Messages.csproj", "EventBus.Messages/"]
RUN dotnet restore "Ordering.API/Ordering.API.csproj"
COPY Ordering.API/ Ordering.API/
COPY EventBus.Messages/ EventBus.Messages/
WORKDIR "/src/Ordering.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "Ordering.API.dll"]
