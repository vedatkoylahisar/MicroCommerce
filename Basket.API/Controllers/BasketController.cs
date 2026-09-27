using Basket.API.Models;
using Basket.API.Repositories;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EventBus.Messages.Events;
using System.Net.Http.Json;
using System.Security.Claims;

namespace Basket.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class BasketController : ControllerBase
    {
        private readonly IBasketRepository _repository;
        private readonly IPublishEndpoint _publishEndpoint;
        private readonly IHttpClientFactory _httpClientFactory;

        private string? CurrentEmail => User.FindFirstValue(ClaimTypes.Email);

        private bool IsOwner(string? userName) =>
            CurrentEmail != null && string.Equals(CurrentEmail, userName, StringComparison.OrdinalIgnoreCase);

        [HttpGet("{userName}")]
        public async Task<IActionResult> GetBasket(string userName)
        {
            if (!IsOwner(userName)) return Forbid();
            var basket = await _repository.GetBasket(userName);
            return Ok(basket ?? new BasketCart(userName));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateBasket(BasketCart basket)
        {
            if (!IsOwner(basket.UserName)) return Forbid();
            return Ok(await _repository.UpdateBasket(basket));
        }

        [HttpDelete("{userName}")]
        public async Task<IActionResult> DeleteBasket(string userName)
        {
            if (!IsOwner(userName)) return Forbid();
            await _repository.DeleteBasket(userName);
            return Ok();
        }
        public BasketController(IBasketRepository repository, IPublishEndpoint publishEndpoint, IHttpClientFactory httpClientFactory)
        {
            _repository = repository;
            _publishEndpoint = publishEndpoint;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout(BasketCheckoutEvent checkoutEvent)
        {
            if (!IsOwner(checkoutEvent.UserName)) return Forbid();

            var basket = await _repository.GetBasket(checkoutEvent.UserName);
            if (basket == null) return NotFound();

            // Sepeti onaylamadan once Catalog.API'ye stok VE fiyat sor. Sepetteki fiyat istemciden
            // geliyor (kullanici tarayicidan degistirmis olabilir), o yuzden siparis Catalog'un
            // guncel/dogrulanmis fiyatina gore olusturulur - sepetteki fiyata asla guvenilmez.
            var catalogClient = _httpClientFactory.CreateClient("CatalogApi");
            var verifyRequest = basket.Items.Select(i => new { productId = i.ProductId, quantity = i.Quantity });
            List<ProductVerification>? verified;
            try
            {
                var verifyResponse = await catalogClient.PostAsJsonAsync("/api/Products/check-stock", verifyRequest);
                if (!verifyResponse.IsSuccessStatusCode)
                    return StatusCode(StatusCodes.Status503ServiceUnavailable, "Ürün bilgisi doğrulanamadı, lütfen tekrar deneyin.");
                verified = await verifyResponse.Content.ReadFromJsonAsync<List<ProductVerification>>();
            }
            catch (HttpRequestException)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, "Ürün bilgisi doğrulanamadı, lütfen tekrar deneyin.");
            }

            if (verified == null)
                return StatusCode(StatusCodes.Status503ServiceUnavailable, "Ürün bilgisi doğrulanamadı, lütfen tekrar deneyin.");

            var shortfalls = verified.Where(v => !v.Sufficient)
                .Select(v => new StockShortfall(v.ProductId, v.ProductName, v.Requested, v.Available))
                .ToList();
            if (shortfalls.Count > 0)
                return Conflict(new { message = "Bazi urunlerde yeterli stok yok.", items = shortfalls });

            // Siparis e-postasi istemciden degil token'dan alinir
            checkoutEvent.EmailAddress = CurrentEmail!;

            var verifiedPriceByProductId = verified.ToDictionary(v => v.ProductId, v => v.Price);
            checkoutEvent.Items = basket.Items.Select(i => new EventBus.Messages.Events.BasketCheckoutItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                Price = verifiedPriceByProductId.GetValueOrDefault(i.ProductId, i.Price)
            }).ToList();
            checkoutEvent.TotalPrice = checkoutEvent.Items.Sum(i => i.Price * i.Quantity);

            await _publishEndpoint.Publish(checkoutEvent);
            await _repository.DeleteBasket(checkoutEvent.UserName);

            return Accepted();
        }

        private record StockShortfall(string ProductId, string ProductName, int Requested, int Available);
        private record ProductVerification(string ProductId, string ProductName, decimal Price, int Requested, int Available, bool Sufficient);
    }
}