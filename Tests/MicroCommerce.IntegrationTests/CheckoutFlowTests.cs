using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace MicroCommerce.IntegrationTests;

/// <summary>
/// Sepete ekleme -> checkout -> RabbitMQ event -> Ordering.API'de siparis olusmasi zincirini,
/// ve stok dogrulama/dusurme akisini gercek altyapiyla (Redis + RabbitMQ + Postgres + Mongo)
/// uctan uca dogrular.
/// </summary>
[Collection("Gateway")]
public class CheckoutFlowTests
{
    private readonly GatewayFixture _fx;
    public CheckoutFlowTests(GatewayFixture fx) => _fx = fx;

    [Fact]
    public async Task Checkout_creates_an_order_and_decrements_stock()
    {
        var adminToken = await _fx.AdminLoginAsync();
        var product = await _fx.CreateProductAsync(adminToken, stockQuantity: 5, price: 25.5m);
        var (email, token) = await _fx.RegisterAndLoginAsync();

        // sepete gercek bir Catalog urunu ekle
        var putBasket = GatewayFixture.WithAuth(HttpMethod.Put, "/api/Basket", token);
        putBasket.Content = JsonContent.Create(new
        {
            userName = email,
            items = new[] { new { productId = product.Id, productName = product.Name, price = product.Price, quantity = 2 } }
        });
        var basketRes = await _fx.Client.SendAsync(putBasket);
        Assert.Equal(HttpStatusCode.OK, basketRes.StatusCode);

        // checkout - baskasi adina degil, sadece kendi userName'i ile calismali (bkz AuthorizationTests)
        var checkoutReq = GatewayFixture.WithAuth(HttpMethod.Post, "/api/Basket/checkout", token);
        checkoutReq.Content = JsonContent.Create(new { userName = email, firstName = "Test", lastName = "User", emailAddress = email });
        var checkoutRes = await _fx.Client.SendAsync(checkoutReq);
        Assert.Equal(HttpStatusCode.Accepted, checkoutRes.StatusCode);

        // sepet checkout sonrasi bos olmali
        var basketAfter = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, $"/api/Basket/{email}", token));
        var basketBody = await basketAfter.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Empty(basketBody.GetProperty("items").EnumerateArray());

        // RabbitMQ -> Ordering.API asenkron oldugu icin siparisin gorunmesini bekle
        var order = await PollUntilOrderExists(email, token);
        Assert.NotNull(order);
        Assert.Equal(51.0m, order!.Value.GetProperty("total").GetDecimal());

        // RabbitMQ -> Catalog.API de asenkron: stogun 5'ten 3'e dusmesini bekle
        var stockAfter = await PollUntilStockEquals(product.Id, expected: 3);
        Assert.Equal(3, stockAfter);
    }

    [Fact]
    public async Task Checkout_uses_the_server_verified_price_not_the_tampered_client_price()
    {
        var adminToken = await _fx.AdminLoginAsync();
        var product = await _fx.CreateProductAsync(adminToken, stockQuantity: 5, price: 100m);
        var (email, token) = await _fx.RegisterAndLoginAsync();

        // kotu niyetli/bozuk bir istemci sepete gercek fiyat yerine 1 kurus yaziyor
        var putBasket = GatewayFixture.WithAuth(HttpMethod.Put, "/api/Basket", token);
        putBasket.Content = JsonContent.Create(new
        {
            userName = email,
            items = new[] { new { productId = product.Id, productName = product.Name, price = 0.01m, quantity = 2 } }
        });
        await _fx.Client.SendAsync(putBasket);

        var checkoutReq = GatewayFixture.WithAuth(HttpMethod.Post, "/api/Basket/checkout", token);
        checkoutReq.Content = JsonContent.Create(new { userName = email, firstName = "Test", lastName = "User", emailAddress = email });
        var checkoutRes = await _fx.Client.SendAsync(checkoutReq);
        Assert.Equal(HttpStatusCode.Accepted, checkoutRes.StatusCode);

        // siparis, sepetteki (kandirilmis) fiyatla degil Catalog'un gercek fiyatiyla olusmali: 100 * 2 = 200
        var order = await PollUntilOrderExists(email, token);
        Assert.NotNull(order);
        Assert.Equal(200m, order!.Value.GetProperty("total").GetDecimal());
    }

    [Fact]
    public async Task Checkout_is_rejected_when_stock_is_insufficient()
    {
        var adminToken = await _fx.AdminLoginAsync();
        var product = await _fx.CreateProductAsync(adminToken, stockQuantity: 1);
        var (email, token) = await _fx.RegisterAndLoginAsync();

        // sepette stoktan fazla miktar var (sepete eklerken degil, checkout'ta engellenmesi bekleniyor)
        var putBasket = GatewayFixture.WithAuth(HttpMethod.Put, "/api/Basket", token);
        putBasket.Content = JsonContent.Create(new
        {
            userName = email,
            items = new[] { new { productId = product.Id, productName = product.Name, price = product.Price, quantity = 5 } }
        });
        await _fx.Client.SendAsync(putBasket);

        var checkoutReq = GatewayFixture.WithAuth(HttpMethod.Post, "/api/Basket/checkout", token);
        checkoutReq.Content = JsonContent.Create(new { userName = email, firstName = "Test", lastName = "User", emailAddress = email });
        var checkoutRes = await _fx.Client.SendAsync(checkoutReq);

        Assert.Equal(HttpStatusCode.Conflict, checkoutRes.StatusCode);

        // reddedilen checkout sepeti silmemeli
        var basketAfter = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, $"/api/Basket/{email}", token));
        var basketBody = await basketAfter.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Single(basketBody.GetProperty("items").EnumerateArray());

        // stok da degismemis olmali
        var stock = await GetStockAsync(product.Id);
        Assert.Equal(1, stock);
    }

    private async Task<JsonElement?> PollUntilOrderExists(string email, string token)
    {
        var deadline = DateTime.UtcNow.AddSeconds(20);

        while (DateTime.UtcNow < deadline)
        {
            var res = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, $"/api/Ordering/orders/{email}", token));
            if (res.IsSuccessStatusCode)
            {
                var orders = await res.Content.ReadFromJsonAsync<JsonElement>();
                var first = orders.EnumerateArray().FirstOrDefault();
                if (first.ValueKind == JsonValueKind.Object) return first;
            }
            await Task.Delay(1000);
        }

        return null;
    }

    private async Task<int?> GetStockAsync(string productId)
    {
        var res = await _fx.Client.GetAsync($"/api/Products/{productId}");
        if (!res.IsSuccessStatusCode) return null;
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("stockQuantity").GetInt32();
    }

    private async Task<int?> PollUntilStockEquals(string productId, int expected)
    {
        var deadline = DateTime.UtcNow.AddSeconds(20);
        int? last = null;

        while (DateTime.UtcNow < deadline)
        {
            last = await GetStockAsync(productId);
            if (last == expected) return last;
            await Task.Delay(1000);
        }

        return last;
    }
}
