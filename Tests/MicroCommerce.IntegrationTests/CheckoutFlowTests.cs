using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace MicroCommerce.IntegrationTests;

/// <summary>
/// Sepete ekleme -> checkout -> RabbitMQ event -> Ordering.API'de siparis olusmasi zincirini
/// gercek altyapiyla (Redis + RabbitMQ + Postgres) uctan uca dogrular.
/// </summary>
[Collection("Gateway")]
public class CheckoutFlowTests
{
    private readonly GatewayFixture _fx;
    public CheckoutFlowTests(GatewayFixture fx) => _fx = fx;

    [Fact]
    public async Task Checkout_creates_an_order_that_belongs_to_the_buyer()
    {
        var (email, token) = await _fx.RegisterAndLoginAsync();

        // sepete urun ekle
        var putBasket = GatewayFixture.WithAuth(HttpMethod.Put, "/api/Basket", token);
        putBasket.Content = JsonContent.Create(new
        {
            userName = email,
            items = new[] { new { productId = "test-1", productName = "Test Urun", price = 25.5m, quantity = 2 } }
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
}
