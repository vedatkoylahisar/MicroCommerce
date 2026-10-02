using Catalog.API.Models;
using Catalog.API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Catalog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _repository;

        public ProductsController(IProductRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _repository.GetProducts();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProductById(string id)
        {
            var product = await _repository.GetProductById(id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProduct(Product product)
        {
            if (product.Price < 0 || product.StockQuantity < 0)
                return BadRequest("Fiyat ve stok adedi negatif olamaz.");

            await _repository.CreateProduct(product);
            return CreatedAtAction(nameof(GetProductById), new { id = product.Id }, product);
        }

        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(Product product)
        {
            if (product.Price < 0 || product.StockQuantity < 0)
                return BadRequest("Fiyat ve stok adedi negatif olamaz.");

            var result = await _repository.UpdateProduct(product);
            if (!result) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(string id)
        {
            var result = await _repository.DeleteProduct(id);
            if (!result) return NotFound();
            return Ok();
        }

        /// <summary>
        /// Checkout'tan once Basket.API tarafindan cagrilir: istenen miktarlar stokta var mi VE
        /// guncel fiyat ne? Basket.API sepetteki (istemcinin gonderdigi, dolayisiyla degistirilmis
        /// olabilecek) fiyata degil, buradan donen fiyata gore siparisi olusturur. Servisler-arasi
        /// bir cagri oldugu icin herkese acik (ayni GetProducts gibi, stok/fiyat zaten musteriye
        /// gosterilen bilgi).
        /// </summary>
        [HttpPost("check-stock")]
        public async Task<IActionResult> CheckStock([FromBody] List<StockCheckItem> items)
        {
            var results = new List<ProductVerification>();
            foreach (var item in items)
            {
                var product = await _repository.GetProductById(item.ProductId);
                results.Add(new ProductVerification(
                    item.ProductId,
                    product?.Name ?? item.ProductId,
                    product?.Price ?? 0m,
                    item.Quantity,
                    product?.StockQuantity ?? 0,
                    product != null && product.StockQuantity >= item.Quantity));
            }
            return Ok(results);
        }

        /// <summary>
        /// Bir siparis iptal edildiginde Ordering.API tarafindan cagrilir: dusurulmus stogu geri
        /// ekler. check-stock gibi servisler-arasi bir cagri - prod'da Catalog.API'nin disariya
        /// acik bir portu olmadigi icin zaten sadece Docker ic agindan erisilebilir.
        /// </summary>
        [HttpPost("restock")]
        public async Task<IActionResult> Restock([FromBody] List<StockCheckItem> items)
        {
            foreach (var item in items)
            {
                if (string.IsNullOrEmpty(item.ProductId)) continue;
                await _repository.IncrementStockAsync(item.ProductId, item.Quantity);
            }
            return Ok();
        }

        /// <summary>Giris yapmis herhangi bir kullanici urune yorum/puan birakabilir.</summary>
        [HttpPost("{id}/reviews")]
        [Authorize]
        public async Task<IActionResult> AddReview(string id, [FromBody] AddReviewRequest request)
        {
            if (request.Rating < 1 || request.Rating > 5)
                return BadRequest("Puan 1 ile 5 arasinda olmalidir.");

            var review = new ProductReview
            {
                UserName = User.FindFirstValue(ClaimTypes.Name) ?? "Kullanıcı",
                UserEmail = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                Rating = request.Rating,
                Comment = request.Comment ?? string.Empty
            };

            var ok = await _repository.AddReviewAsync(id, review);
            if (!ok) return NotFound();
            return Ok(review);
        }
    }

    public record StockCheckItem(string ProductId, int Quantity);
    public record ProductVerification(string ProductId, string ProductName, decimal Price, int Requested, int Available, bool Sufficient);
    public record AddReviewRequest(int Rating, string? Comment);
}