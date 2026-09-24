using System.Net;
using System.Net.Http.Json;

namespace MicroCommerce.IntegrationTests;

/// <summary>
/// JWT dogrulamasinin ve sahiplik kurallarinin (kendi sepetin/siparisin/mesajin, admin-only
/// endpoint'ler) tum servislerde gercekten uygulandigini dogrular.
/// </summary>
[Collection("Gateway")]
public class AuthorizationTests
{
    private readonly GatewayFixture _fx;
    public AuthorizationTests(GatewayFixture fx) => _fx = fx;

    [Fact]
    public async Task Anonymous_can_browse_products_but_not_modify()
    {
        var list = await _fx.Client.GetAsync("/api/Products");
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);

        var create = await _fx.Client.PostAsJsonAsync("/api/Products", new { name = "x", category = "c", description = "d", price = 1 });
        Assert.Equal(HttpStatusCode.Unauthorized, create.StatusCode);
    }

    [Fact]
    public async Task Regular_user_cannot_create_product_only_admin_can()
    {
        var (_, userToken) = await _fx.RegisterAndLoginAsync();
        var adminToken = await _fx.AdminLoginAsync();

        var asUser = GatewayFixture.WithAuth(HttpMethod.Post, "/api/Products", userToken);
        asUser.Content = JsonContent.Create(new { name = "x", category = "c", description = "d", price = 1 });
        var userRes = await _fx.Client.SendAsync(asUser);
        Assert.Equal(HttpStatusCode.Forbidden, userRes.StatusCode);

        var asAdmin = GatewayFixture.WithAuth(HttpMethod.Post, "/api/Products", adminToken);
        asAdmin.Content = JsonContent.Create(new { name = "test-urun", category = "c", description = "d", price = 1 });
        var adminRes = await _fx.Client.SendAsync(asAdmin);
        Assert.Equal(HttpStatusCode.Created, adminRes.StatusCode);
    }

    [Fact]
    public async Task Only_admin_can_list_all_users()
    {
        var (_, userToken) = await _fx.RegisterAndLoginAsync();
        var adminToken = await _fx.AdminLoginAsync();

        var anon = await _fx.Client.GetAsync("/api/Auth/users");
        Assert.Equal(HttpStatusCode.Unauthorized, anon.StatusCode);

        var asUser = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, "/api/Auth/users", userToken));
        Assert.Equal(HttpStatusCode.Forbidden, asUser.StatusCode);

        var asAdmin = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, "/api/Auth/users", adminToken));
        Assert.Equal(HttpStatusCode.OK, asAdmin.StatusCode);
    }

    [Fact]
    public async Task User_cannot_read_or_modify_another_users_basket()
    {
        var (emailA, tokenA) = await _fx.RegisterAndLoginAsync();
        var (_, tokenB) = await _fx.RegisterAndLoginAsync();

        var getAsB = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, $"/api/Basket/{emailA}", tokenB));
        Assert.Equal(HttpStatusCode.Forbidden, getAsB.StatusCode);

        var putAsB = GatewayFixture.WithAuth(HttpMethod.Put, "/api/Basket", tokenB);
        putAsB.Content = JsonContent.Create(new { userName = emailA, items = Array.Empty<object>() });
        var putRes = await _fx.Client.SendAsync(putAsB);
        Assert.Equal(HttpStatusCode.Forbidden, putRes.StatusCode);

        var getAsA = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, $"/api/Basket/{emailA}", tokenA));
        Assert.Equal(HttpStatusCode.OK, getAsA.StatusCode);
    }

    [Fact]
    public async Task User_cannot_read_another_users_orders_but_admin_can_read_all()
    {
        var (emailA, tokenA) = await _fx.RegisterAndLoginAsync();
        var (_, tokenB) = await _fx.RegisterAndLoginAsync();
        var adminToken = await _fx.AdminLoginAsync();

        var bAsB = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, $"/api/Ordering/orders/{emailA}", tokenB));
        Assert.Equal(HttpStatusCode.Forbidden, bAsB.StatusCode);

        var aAsA = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, $"/api/Ordering/orders/{emailA}", tokenA));
        Assert.Equal(HttpStatusCode.OK, aAsA.StatusCode);

        var allAsUser = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, "/api/Ordering/orders", tokenA));
        Assert.Equal(HttpStatusCode.Forbidden, allAsUser.StatusCode);

        var allAsAdmin = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, "/api/Ordering/orders", adminToken));
        Assert.Equal(HttpStatusCode.OK, allAsAdmin.StatusCode);
    }

    [Fact]
    public async Task User_cannot_open_conversation_on_behalf_of_another_user()
    {
        var (emailA, _) = await _fx.RegisterAndLoginAsync();
        var (_, tokenB) = await _fx.RegisterAndLoginAsync();

        var req = GatewayFixture.WithAuth(HttpMethod.Post, "/api/Messages", tokenB);
        req.Content = JsonContent.Create(new { userEmail = emailA, sellerName = "Satici", orderId = "o1", initialMessage = (string?)null });
        var res = await _fx.Client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Garbage_token_is_rejected()
    {
        var res = await _fx.Client.SendAsync(GatewayFixture.WithAuth(HttpMethod.Get, "/api/Ordering/orders", "not-a-real-token"));
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }
}
