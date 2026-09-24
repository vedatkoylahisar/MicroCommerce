using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Messages.API.Data;
using Messages.API.Models;
using System.Security.Claims;

namespace Messages.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly MessageDbContext _context;

        public MessagesController(MessageDbContext context)
        {
            _context = context;
        }

        private bool IsOwner(string? email) =>
            string.Equals(User.FindFirstValue(ClaimTypes.Email), email, StringComparison.OrdinalIgnoreCase);

        private bool IsOwnerOrAdmin(string? email) => User.IsInRole("Admin") || IsOwner(email);

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllConversations()
        {
            var conversations = await _context.Conversations
                .Include(c => c.Messages)
                .ToListAsync();

            conversations = conversations
                .OrderByDescending(c => c.Messages.Count > 0 ? c.Messages.Max(m => m.Time) : DateTime.MinValue)
                .ToList();

            var result = conversations.Select(c => new
            {
                id = c.Id,
                userEmail = c.UserEmail,
                sellerName = c.SellerName,
                sellerAvatar = c.SellerAvatar,
                orderId = c.OrderId,
                lastMessage = c.Messages.OrderByDescending(m => m.Time).FirstOrDefault()?.Text ?? "",
                lastTime = c.Messages.OrderByDescending(m => m.Time).FirstOrDefault()?.Time,
                unread = c.Unread,
                messages = c.Messages.OrderBy(m => m.Time).Select(m => new
                {
                    id = m.Id,
                    from = m.From,
                    text = m.Text,
                    time = m.Time
                })
            });

            return Ok(result);
        }

        [HttpGet("{email}")]
        public async Task<IActionResult> GetConversations(string email)
        {
            if (!IsOwnerOrAdmin(email)) return Forbid();

            var conversations = await _context.Conversations
                .Include(c => c.Messages)
                .Where(c => c.UserEmail == email)
                .ToListAsync();

            conversations = conversations
                .OrderByDescending(c => c.Messages.Count > 0 ? c.Messages.Max(m => m.Time) : DateTime.MinValue)
                .ToList();

            foreach (var conv in conversations)
                conv.Unread = 0;
            await _context.SaveChangesAsync();

            var result = conversations.Select(c => new
            {
                id = c.Id,
                sellerName = c.SellerName,
                sellerAvatar = c.SellerAvatar,
                orderId = c.OrderId,
                lastMessage = c.Messages.OrderByDescending(m => m.Time).FirstOrDefault()?.Text ?? "",
                lastTime = c.Messages.OrderByDescending(m => m.Time).FirstOrDefault()?.Time,
                unread = 0,
                messages = c.Messages.OrderBy(m => m.Time).Select(m => new
                {
                    id = m.Id,
                    from = m.From,
                    text = m.Text,
                    time = m.Time
                })
            });

            return Ok(result);
        }

        [HttpPost("{conversationId}/messages")]
        public async Task<IActionResult> SendMessage(int conversationId, [FromBody] SendMessageRequest request)
        {
            var conversation = await _context.Conversations.FindAsync(conversationId);
            if (conversation == null) return NotFound();
            if (!IsOwner(conversation.UserEmail)) return Forbid();

            var message = new Message
            {
                ConversationId = conversationId,
                From = "user",
                Text = request.Text,
                Time = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { id = message.Id, from = message.From, text = message.Text, time = message.Time });
        }

        [HttpPost]
        public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request)
        {
            if (!IsOwnerOrAdmin(request.UserEmail)) return Forbid();

            var avatar = string.IsNullOrEmpty(request.SellerAvatar)
                ? request.SellerName[0].ToString().ToUpper()
                : request.SellerAvatar;

            var conversation = new Conversation
            {
                UserEmail = request.UserEmail,
                SellerName = request.SellerName,
                SellerAvatar = avatar,
                OrderId = request.OrderId,
                Unread = 0
            };

            if (!string.IsNullOrEmpty(request.InitialMessage))
            {
                conversation.Messages.Add(new Message
                {
                    From = "seller",
                    Text = request.InitialMessage,
                    Time = DateTime.UtcNow
                });
                conversation.Unread = 1;
            }

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetConversations), new { email = request.UserEmail }, new { id = conversation.Id });
        }

        [HttpPost("{conversationId}/reply")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SellerReply(int conversationId, [FromBody] SendMessageRequest request)
        {
            var conversation = await _context.Conversations.FindAsync(conversationId);
            if (conversation == null) return NotFound();

            var message = new Message
            {
                ConversationId = conversationId,
                From = "seller",
                Text = request.Text,
                Time = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            conversation.Unread++;
            await _context.SaveChangesAsync();

            return Ok(new { id = message.Id, from = message.From, text = message.Text, time = message.Time });
        }
    }

    public record SendMessageRequest(string Text);
    public record CreateConversationRequest(string UserEmail, string SellerName, string? SellerAvatar, string OrderId, string? InitialMessage);
}
