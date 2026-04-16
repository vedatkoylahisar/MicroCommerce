FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Messages.API/Messages.API.csproj", "Messages.API/"]
RUN dotnet restore "Messages.API/Messages.API.csproj"
COPY Messages.API/ Messages.API/
WORKDIR "/src/Messages.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "Messages.API.dll"]
