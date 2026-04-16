using Microsoft.EntityFrameworkCore;
using Messages.API.Models;

namespace Messages.API.Data
{
    public class MessageDbContext : DbContext
    {
        public MessageDbContext(DbContextOptions<MessageDbContext> options) : base(options) { }

        public DbSet<Conversation> Conversations => Set<Conversation>();
        public DbSet<Message> Messages => Set<Message>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Conversation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserEmail).IsRequired().HasMaxLength(200);
                entity.Property(e => e.SellerName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.SellerAvatar).HasMaxLength(10);
                entity.Property(e => e.OrderId).HasMaxLength(50);
                entity.HasIndex(e => e.UserEmail);
                entity.HasMany(e => e.Messages)
                      .WithOne()
                      .HasForeignKey(m => m.ConversationId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.From).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Text).IsRequired();
            });
        }
    }
}
