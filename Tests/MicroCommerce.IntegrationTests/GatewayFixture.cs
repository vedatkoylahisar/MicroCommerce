using System.Net.Http.Json;

namespace MicroCommerce.IntegrationTests;

/// <summary>
/// Testler calisan gercek Docker Compose yigina (gateway + tum servisler) karsi calisir.
/// Sahte/mock yoktur: bu proje "gercekten ayakta mi, Redis/RabbitMQ/Postgres/Mongo baglantisi
/// kopmus mu" sorusunu otomatik ve tekrar calistirilabilir sekilde cevaplar.
///
/// Calistirmadan once: docker compose up -d --build
/// Sonra: dotnet test
/// Gateway adresi GATEWAY_URL ortam degiskeni ile degistirilebilir (varsayilan http://localhost:7014).
/// </summary>
public class GatewayFixture : IAsyncLifetime
{
    public HttpClient Client { get; }
    public string GatewayUrl { get; }

    public GatewayFixture()
    {
        GatewayUrl = Environment.GetEnvironmentVariable("GATEWAY_URL") ?? "http://localhost:7014";
        Client = new HttpClient { BaseAddress = new Uri(GatewayUrl), Timeout = TimeSpan.FromSeconds(30) };
    }

    public async Task InitializeAsync()
    {
        // Yigin daha az once ayaga kalkmis olabilir (docker compose up -d hemen sonra).
        // Testler gercek bir "bozuk sistem" hatasi ile "henuz hazir degil" hatasini
        // birbirine karistirmasin diye burada kisa bir bekleme/deneme yapiyoruz.
        var deadline = DateTime.UtcNow.AddSeconds(60);
        Exception? last = null;
        while (DateTime.UtcNow < deadline)
        {
            try
            {
                var res = await Client.GetAsync("/health");
                if (res.IsSuccessStatusCode) return;
            }
            catch (Exception ex)
            {
                last = ex;
            }
            await Task.Delay(2000);
        }

        throw new Exception(
            $"Gateway {GatewayUrl} 60 saniye icinde hazir olmadi. " +
            $"'docker compose up -d --build' calistirdin mi? Son hata: {last?.Message}");
    }

    public Task DisposeAsync()
    {
        Client.Dispose();
        return Task.CompletedTask;
    }

    /// <summary>Kayit + login yapip token ve e-postayi dondurur. Testler arasi carpismayi onlemek icin rastgele e-posta uretir.</summary>
    public async Task<(string Email, string Token)> RegisterAndLoginAsync(string firstName = "Test", string lastName = "User")
    {
        var email = $"test-{Guid.NewGuid():N}@example.com";
        const string password = "Test123!";

        var registerRes = await Client.PostAsJsonAsync("/api/Auth/register", new { firstName, lastName, email, password });
        registerRes.EnsureSuccessStatusCode();

        var loginRes = await Client.PostAsJsonAsync("/api/Auth/login", new { email, password });
        loginRes.EnsureSuccessStatusCode();
        var login = await loginRes.Content.ReadFromJsonAsync<LoginResponse>();

        return (email, login!.Token);
    }

    public async Task<string> AdminLoginAsync(string username = "admin", string password = "Admin123!")
    {
        var res = await Client.PostAsJsonAsync("/api/Auth/admin-login", new { username, password });
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<TokenResponse>();
        return body!.Token;
    }

    public static HttpRequestMessage WithAuth(HttpMethod method, string url, string token) =>
        new(method, url) { Headers = { Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token) } };

    private record LoginResponse(string Token, string Email, string? FirstName);
    private record TokenResponse(string Token);
}

[CollectionDefinition("Gateway")]
public class GatewayCollection : ICollectionFixture<GatewayFixture> { }
