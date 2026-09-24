using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ordering.API.Data;
using Ordering.API.Models;
using System.Security.Claims;

namespace Ordering.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class OrderingController : ControllerBase
    {
        private readonly OrderDbContext _context;

        public OrderingController(OrderDbContext context)
        {
            _context = context;
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
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            if (Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var newStatus))
            {
                order.Status = newStatus;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            return BadRequest("Geçersiz durum.");
        }

        [HttpPatch("orders/{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();
            if (!IsOwnerOrAdmin(order.Email)) return Forbid();
            if (order.Status == OrderStatus.Delivered || order.Status == OrderStatus.Cancelled)
                return BadRequest("Bu sipariş iptal edilemez.");

            order.Status = OrderStatus.Cancelled;
            await _context.SaveChangesAsync();
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
