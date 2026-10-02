using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ordering.API.Data;
using Ordering.API.Models;
using System.Net.Http.Json;
using System.Security.Claims;

namespace Ordering.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class OrderingController : ControllerBase
    {
        private readonly OrderDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<OrderingController> _logger;

        public OrderingController(OrderDbContext context, IHttpClientFactory httpClientFactory, ILogger<OrderingController> logger)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        /// <summary>
        /// Siparis iptal edildiginde dusurulmus stogu Catalog.API'ye geri ekletir. Catalog'a
        /// ulasilamazsa siparis yine de iptal kalir (musteri parasini geri almayi bekliyor,
        /// bunu stok senkron hatasina bagli tutmak daha kotu bir UX olurdu) - sadece logluyoruz.
        /// Bilinen sinir: bu ayni zamanda onemli bir guvenilirlik eksigi (outbox yok), gercek
        /// bir dagitik islem degil.
        /// </summary>
        private async Task RestockItemsAsync(Order order)
        {
            var items = order.Items
                .Where(i => !string.IsNullOrEmpty(i.ProductId))
                .Select(i => new { productId = i.ProductId, quantity = i.Quantity })
                .ToList();
            if (items.Count == 0) return;

            try
            {
                var client = _httpClientFactory.CreateClient("CatalogApi");
                var res = await client.PostAsJsonAsync("/api/Products/restock", items);
                if (!res.IsSuccessStatusCode)
                    _logger.LogWarning("Stok geri eklenemedi (HTTP {Status}). OrderId={OrderId}", res.StatusCode, order.Id);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning(ex, "Stok geri eklenemedi, Catalog.API'ye ulasilamadi. OrderId={OrderId}", order.Id);
            }
        }

        private bool IsOwnerOrAdmin(string? email) =>
            User.IsInRole("Admin") ||
            string.Equals(User.FindFirstValue(ClaimTypes.Email), email, StringComparison.OrdinalIgnoreCase);

        [HttpGet("orders/{email}")]
        public async Task<IActionResult> GetOrdersByEmail(string email)
        {
            if (!IsOwnerOrAdmin(email)) return Forbid();

            var orders = await _context.Orders
                .Include(o => o.Items)
                .Where(o => o.Email == email)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var result = orders.Select(o => new
            {
                id = o.Id,
                trackingCode = o.TrackingCode,
                date = o.CreatedAt.ToString("yyyy-MM-dd"),
                status = o.Status.ToString().ToLower(),
                total = o.TotalPrice,
                items = o.Items.Select(i => new
                {
                    productName = i.ProductName,
                    quantity = i.Quantity,
                    price = i.Price
                })
            });

            return Ok(result);
        }

        [HttpGet("orders")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.Items)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var result = orders.Select(o => new
            {
                id = o.Id,
                trackingCode = o.TrackingCode,
                email = o.Email,
                firstName = o.FirstName,
                lastName = o.LastName,
                date = o.CreatedAt.ToString("yyyy-MM-dd"),
                status = o.Status.ToString().ToLower(),
                total = o.TotalPrice,
                items = o.Items.Select(i => new { i.ProductName, i.Quantity, i.Price })
            });

            return Ok(result);
        }

        [HttpPatch("orders/{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string status)
        {
            var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound();

            if (!Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var newStatus))
                return BadRequest("Geçersiz durum.");

            var wasAlreadyCancelled = order.Status == OrderStatus.Cancelled;
            order.Status = newStatus;
            await _context.SaveChangesAsync();

            if (newStatus == OrderStatus.Cancelled && !wasAlreadyCancelled)
                await RestockItemsAsync(order);

            return NoContent();
        }

        [HttpPatch("orders/{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound();
            if (!IsOwnerOrAdmin(order.Email)) return Forbid();
            if (order.Status == OrderStatus.Delivered || order.Status == OrderStatus.Cancelled)
                return BadRequest("Bu sipariş iptal edilemez.");

            order.Status = OrderStatus.Cancelled;
            await _context.SaveChangesAsync();
            await RestockItemsAsync(order);
            return NoContent();
        }

        [HttpDelete("orders/{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();
            if (!IsOwnerOrAdmin(order.Email)) return Forbid();

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
