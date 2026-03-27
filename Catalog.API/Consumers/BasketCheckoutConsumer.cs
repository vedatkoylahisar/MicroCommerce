using EventBus.Messages.Events;
using MassTransit;

namespace Catalog.API.Consumers
{
    public class BasketCheckoutConsumer : IConsumer<BasketCheckoutEvent>
    {
        public async Task Consume(ConsumeContext<BasketCheckoutEvent> context)
        {
            var message = context.Message;
            Console.WriteLine($"Siparis alindi: {message.UserName}, Tutar: {message.TotalPrice}");
        }
    }
}