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
        /// Checkout'tan once Basket.API tarafindan cagrilir: istenen miktarlar stokta var mi?
        /// Bos liste = hepsi yeterli. Servisler-arasi bir cagri oldugu icin herkese acik (ayni
        /// GetProducts gibi, stok adedi zaten musteriye "son 3 adet" gibi gosterilebilecek bilgi).
        /// </summary>
        [HttpPost("check-stock")]
        public async Task<IActionResult> CheckStock([FromBody] List<StockCheckItem> items)
        {
            var shortfalls = new List<StockShortfall>();
            foreach (var item in items)
            {
                var product = await _repository.GetProductById(item.ProductId);
                if (product == null || product.StockQuantity < item.Quantity)
                {
                    shortfalls.Add(new StockShortfall(
                        item.ProductId,
                        product?.Name ?? item.ProductId,
                        item.Quantity,
                        product?.StockQuantity ?? 0));
                }
            }
            return Ok(shortfalls);
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
    public record StockShortfall(string ProductId, string ProductName, int Requested, int Available);
    public record AddReviewRequest(int Rating, string? Comment);
}