# MicroCommerce

A small e-commerce platform built to practice microservices architecture: independent services
talking over an API gateway and RabbitMQ, each with its own database.

```
React → Ocelot Gateway → Catalog.API (Mongo)
                        → Basket.API (Redis) ──► RabbitMQ ──► Ordering.API (Postgres)
                        → Identity.API (Postgres) — JWT auth
                        → Messages.API (Postgres)
```

Checkout is asynchronous: `Basket.API` publishes a `BasketCheckoutEvent` to RabbitMQ instead of
calling `Ordering.API` directly, so the services stay loosely coupled.

## Stack

.NET 8 (ASP.NET Core, EF Core) · MassTransit + RabbitMQ · MongoDB · Redis · PostgreSQL ·
Ocelot API Gateway · React · Docker Compose · GitHub Actions

## Features

- JWT authentication with role- and ownership-based authorization on every service
- `/health` endpoints that check real dependency connectivity (Mongo/Redis/Postgres/RabbitMQ),
  wired into Docker healthchecks
- An xUnit integration test suite that runs against the live stack (checkout flow, auth,
  ownership) — required to pass in CI before any image is published
- Product catalog, cart, checkout, order tracking, buyer↔seller messaging, and an admin panel

## Running it

```bash
git clone https://github.com/vedatkoylahisar/MicroCommerce.git
cd MicroCommerce
docker compose up -d --build
```

- Frontend: http://localhost:3000 (admin panel at `/admin`)
- API Gateway: http://localhost:7014

Run the tests against the running stack:

```bash
dotnet test Tests/MicroCommerce.IntegrationTests
```

## Known limitations

Learning project, not production-ready: cart price isn't re-validated server-side, no
outbox/idempotency on checkout, no rate limiting on login, and CORS is wide open. Working
through these next.
