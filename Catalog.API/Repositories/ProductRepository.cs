using Catalog.API.Models;
using Catalog.API.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Catalog.API.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly IMongoCollection<Product> _products;

        public ProductRepository(IMongoClient mongoClient, IOptions<DatabaseSettings> settings)
        {
            var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
            _products = database.GetCollection<Product>(settings.Value.CollectionName);
        }

        public async Task<IEnumerable<Product>> GetProducts()
        {
            return await _products.Find(p => true).ToListAsync();
        }

        public async Task<Product> GetProductById(string id)
        {
            return await _products.Find(p => p.Id == id).FirstOrDefaultAsync();
        }

        public async Task CreateProduct(Product product)
        {
            await _products.InsertOneAsync(product);
        }

        public async Task<bool> UpdateProduct(Product product)
        {
            var result = await _products.ReplaceOneAsync(p => p.Id == product.Id, product);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteProduct(string id)
        {
            var result = await _products.DeleteOneAsync(p => p.Id == id);
            return result.IsAcknowledged && result.DeletedCount > 0;
        }

        public async Task<bool> TryDecrementStockAsync(string productId, int quantity)
        {
            // Filtreye StockQuantity >= quantity kosulunu koymak, MongoDB'nin bu guncellemeyi
            // atomik uygulamasini saglar: ayni urune yapilan es zamanli iki dusurme birbirini
            // ezip stogu eksiye dusuremez (race condition'a karsi guvenli).
            var filter = Builders<Product>.Filter.Where(p => p.Id == productId && p.StockQuantity >= quantity);
            var update = Builders<Product>.Update.Inc(p => p.StockQuantity, -quantity);
            var result = await _products.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task IncrementStockAsync(string productId, int quantity)
        {
            var update = Builders<Product>.Update.Inc(p => p.StockQuantity, quantity);
            await _products.UpdateOneAsync(p => p.Id == productId, update);
        }

        public async Task<bool> AddReviewAsync(string productId, ProductReview review)
        {
            var update = Builders<Product>.Update.Push(p => p.Reviews, review);
            var result = await _products.UpdateOneAsync(p => p.Id == productId, update);
            return result.MatchedCount > 0;
        }
    }
}