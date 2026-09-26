using Catalog.API.Repositories;
using EventBus.Messages.Events;
using MassTransit;

namespace Catalog.API.Consumers
{
    public class BasketCheckoutConsumer : IConsumer<BasketCheckoutEvent>
    {
        private readonly IProductRepository _repository;
        private readonly ILogger<BasketCheckoutConsumer> _logger;

        public BasketCheckoutConsumer(IProductRepository repository, ILogger<BasketCheckoutConsumer> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<BasketCheckoutEvent> context)
        {
            var message = context.Message;

            // Basket.API checkout'tan once stogu zaten kontrol etti (check-stock), bu yuzden
            // burada yetersiz stokla karsilasmak normalde beklenmez. Yine de tamamen es zamanli
            // iki checkout arasinda kucuk bir yaris penceresi olabilir; bu durumda dusurulenleri
            // geri alip (telafi/compensation) durumu logluyoruz - siparis Ordering.API tarafinda
            // ayri bir consumer ile zaten olusturuluyor, burada onu iptal etmiyoruz (bilinen sinir).
            var decremented = new List<(string ProductId, int Quantity)>();
            foreach (var item in message.Items)
            {
                if (string.IsNullOrEmpty(item.ProductId))
                {
                    _logger.LogWarning("BasketCheckoutItem icin ProductId yok, stok dusurulemedi: {ProductName}", item.ProductName);
                    continue;
                }

                var ok = await _repository.TryDecrementStockAsync(item.ProductId, item.Quantity);
                if (ok)
                {
                    decremented.Add((item.ProductId, item.Quantity));
                }
                else
                {
                    _logger.LogWarning(
                        "Stok yetersiz, dusurulemedi: ProductId={ProductId}, Istenen={Quantity}. Onceki dusurmeler geri aliniyor.",
                        item.ProductId, item.Quantity);
                    foreach (var (productId, quantity) in decremented)
                        await _repository.IncrementStockAsync(productId, quantity);
                    return;
                }
            }

            _logger.LogInformation("Siparis alindi: {UserName}, Tutar: {TotalPrice}, stok dusuruldu.", message.UserName, message.TotalPrice);
        }
    }
}