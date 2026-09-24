using System.Net;

namespace MicroCommerce.IntegrationTests;

/// <summary>
/// Her servisin kendi bagimliligina (Mongo/Redis/Postgres, RabbitMQ) gercekten baglanabildigini
/// dogrular. Bu servis kapali/patlamis olsa bile ayakta gorunebilir (process calisiyor ama
/// veritabanina baglanamiyor) - health check tam olarak bunu yakalamak icin var.
/// </summary>
[Collection("Gateway")]
public class HealthCheckTests
{
    private readonly GatewayFixture _fx;
    public HealthCheckTests(GatewayFixture fx) => _fx = fx;

    [Theory]
    [InlineData("/health")]              // gateway'in kendisi
    [InlineData("/health/catalog")]      // -> MongoDB
    [InlineData("/health/basket")]       // -> Redis (+ RabbitMQ)
    [InlineData("/health/identity")]     // -> Postgres
    [InlineData("/health/ordering")]     // -> Postgres (+ RabbitMQ)
    [InlineData("/health/messages")]     // -> Postgres
    public async Task Service_health_endpoint_reports_healthy(string path)
    {
        var res = await _fx.Client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.Equal("Healthy", (await res.Content.ReadAsStringAsync()).Trim());
    }
}
