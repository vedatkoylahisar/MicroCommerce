FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["OcelotGateway/OcelotGateway.csproj", "OcelotGateway/"]
RUN dotnet restore "OcelotGateway/OcelotGateway.csproj"
COPY OcelotGateway/ OcelotGateway/
WORKDIR "/src/OcelotGateway"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
COPY OcelotGateway/ocelot.docker.json /app/ocelot.json
EXPOSE 80
ENTRYPOINT ["dotnet", "OcelotGateway.dll"]
