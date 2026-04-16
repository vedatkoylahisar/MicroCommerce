namespace Messages.API.Models
{
    public class Conversation
    {
        public int Id { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string SellerName { get; set; } = string.Empty;
        public string SellerAvatar { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public int Unread { get; set; }
        public List<Message> Messages { get; set; } = new();
    }
}
