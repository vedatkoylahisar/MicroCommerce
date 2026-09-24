# MicroCommerce.IntegrationTests

Gercek Docker Compose yigina (gateway + 5 servis + Mongo/Redis/Postgres/RabbitMQ) karsi calisan
uctan uca testler. Amac: mock degil, gercek altyapi baglantilarinin (Redis, RabbitMQ, Postgres,
Mongo) calistigini ve JWT/sahiplik kurallarinin tum servislerde uygulandigini dogrulamak.

## Calistirma

```
docker compose up -d --build
dotnet test Tests/MicroCommerce.IntegrationTests
```

Gateway adresi varsayilan olarak `http://localhost:7014`. Farkli bir adres icin:

```
GATEWAY_URL=http://<host>:7014 dotnet test Tests/MicroCommerce.IntegrationTests
```

## Ne test ediliyor

- **HealthCheckTests** — gateway ve her servisin `/health` endpoint'i gercekten Mongo/Redis/
  Postgres'e (ve MassTransit uzerinden RabbitMQ'ya) baglanabiliyor mu. Bir bagimlilik cokerse
  (orn. Redis durursa) bu testler kirmizi olur — servisin process'i ayakta olsa bile.
- **AuthorizationTests** — anonim/kullanici/admin rolleri dogru endpoint'lere erisebiliyor mu,
  bir kullanici baskasinin sepetine/siparisine/mesajina erisemiyor mu.
- **CheckoutFlowTests** — sepete ekleme -> checkout -> RabbitMQ event -> Ordering.API'de
  siparisin gercekten olusmasi zincirini uctan uca dogrular.

## CI

`.github/workflows/docker-publish.yml` icindeki `test` job'u her push'ta bu yigini ayaga
kaldirir, testleri calistirir ve basarisiz olursa image build/push adimini calistirmaz.
