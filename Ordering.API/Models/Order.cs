namespace Ordering.API.Models
{
    public enum OrderStatus
    {
        Pending,
        Processing,
        Shipped,
        Delivered,
        Cancelled
    }

    public class Order
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Processing;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string TrackingCode { get; set; } = string.Empty;
        public List<OrderItem> Items { get; set; } = new();
    }
}