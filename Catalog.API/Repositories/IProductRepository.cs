using Catalog.API.Models;

namespace Catalog.API.Repositories
{
    public interface IProductRepository
    {
        Task<IEnumerable<Product>> GetProducts();
        Task<Product> GetProductById(string id);
        Task CreateProduct(Product product);
        Task<bool> UpdateProduct(Product product);
        Task<bool> DeleteProduct(string id);

        /// <summary>Stogu atomik olarak dusurur. Yetersiz stok/urun yoksa false doner, hicbir sey degismez.</summary>
        Task<bool> TryDecrementStockAsync(string productId, int quantity);

        /// <summary>Basarisiz bir coklu-urun islemini geri almak (telafi) icin stogu artirir.</summary>
        Task IncrementStockAsync(string productId, int quantity);
    }
}