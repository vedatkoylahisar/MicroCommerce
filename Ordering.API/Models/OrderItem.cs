namespace Ordering.API.Models
{
    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        // Nullable: bu alan eklenmeden once olusmus eski siparislerde bos olabilir -
        // o siparişler iptal edilirse stok otomatik geri eklenemez (bilinen sinir).
        public string? ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}
