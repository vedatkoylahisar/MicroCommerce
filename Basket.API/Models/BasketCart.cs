namespace Basket.API.Models
{

    public class BasketCart
    {
        public BasketCart(string userName)
        {
            UserName = userName;
        }

        public string UserName { get; set; }
        public List<BasketCartItem> Items { get; set; } = new();
        public decimal TotalPrice => Items.Sum(i => i.Price * i.Quantity);
    }

    public class BasketCartItem
    {
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
}