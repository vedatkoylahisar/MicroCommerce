using EventBus.Messages.Events;
using MassTransit;
using Ordering.API.Data;
using Ordering.API.Models;

namespace Ordering.API.EventBusConsumer
{
    public class BasketCheckoutConsumer : IConsumer<BasketCheckoutEvent>
    {
        private readonly OrderDbContext _context;
        private readonly ILogger<BasketCheckoutConsumer> _logger;

        public BasketCheckoutConsumer(OrderDbContext context, ILogger<BasketCheckoutConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<BasketCheckoutEvent> context)
        {
            var message = context.Message;

            _logger.LogInformation("BasketCheckoutEvent alındı, kullanıcı: {UserName}", message.UserName);

            var order = new Order
            {
                UserName = message.UserName,
                Email = message.EmailAddress,
                FirstName = message.FirstName,
                LastName = message.LastName,
                TotalPrice = message.TotalPrice,
                Status = OrderStatus.Processing,
                CreatedAt = DateTime.UtcNow,
                TrackingCode = GenerateTrackingCode(),
                Items = message.Items.Select(i => new OrderItem
                {
                    ProductName = i.ProductName,
                    Quantity = i.Quantity,
                    Price = i.Price
                }).ToList()
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Sipariş oluşturuldu. Id: {OrderId}, Takip: {TrackingCode}",
                order.Id, order.TrackingCode);
        }

        private static string GenerateTrackingCode()
        {
            return "ORD-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
        }
    }
}
