using Basket.API.Models;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Basket.API.Repositories
{
    public class BasketRepository : IBasketRepository
    {
        private readonly IDistributedCache _cache;

        public BasketRepository(IDistributedCache cache)
        {
            _cache = cache;
        }

        public async Task<BasketCart> GetBasket(string userName)
        {
            var basket = await _cache.GetStringAsync(userName);
            if (string.IsNullOrEmpty(basket)) return null;
            return JsonSerializer.Deserialize<BasketCart>(basket);
        }

        public async Task<BasketCart> UpdateBasket(BasketCart basket)
        {
            await _cache.SetStringAsync(basket.UserName, JsonSerializer.Serialize(basket));
            return await GetBasket(basket.UserName);
        }

        public async Task<bool> DeleteBasket(string userName)
        {
            await _cache.RemoveAsync(userName);
            return true;
        }
    }
}