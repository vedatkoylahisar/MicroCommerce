using Basket.API.Models;
using Basket.API.Repositories;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EventBus.Messages.Events;
using System.Security.Claims;

namespace Basket.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class BasketController : ControllerBase
    {
        private readonly IBasketRepository _repository;
        private readonly IPublishEndpoint _publishEndpoint;

        private string? CurrentEmail => User.FindFirstValue(ClaimTypes.Email);

        private bool IsOwner(string? userName) =>
            CurrentEmail != null && string.Equals(CurrentEmail, userName, StringComparison.OrdinalIgnoreCase);

        [HttpGet("{userName}")]
        public async Task<IActionResult> GetBasket(string userName)
        {
            if (!IsOwner(userName)) return Forbid();
            var basket = await _repository.GetBasket(userName);
            return Ok(basket ?? new BasketCart(userName));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateBasket(BasketCart basket)
        {
            if (!IsOwner(basket.UserName)) return Forbid();
            return Ok(await _repository.UpdateBasket(basket));
        }

        [HttpDelete("{userName}")]
        public async Task<IActionResult> DeleteBasket(string userName)
        {
            if (!IsOwner(userName)) return Forbid();
            await _repository.DeleteBasket(userName);
            return Ok();
        }
        public BasketController(IBasketRepository repository, IPublishEndpoint publishEndpoint)
        {
            _repository = repository;
            _publishEndpoint = publishEndpoint;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout(BasketCheckoutEvent checkoutEvent)
        {
            if (!IsOwner(checkoutEvent.UserName)) return Forbid();

            var basket = await _repository.GetBasket(checkoutEvent.UserName);
            if (basket == null) return NotFound();

            // Siparis e-postasi istemciden degil token'dan alinir
            checkoutEvent.EmailAddress = CurrentEmail!;

            checkoutEvent.TotalPrice = basket.TotalPrice;
            checkoutEvent.Items = basket.Items.Select(i => new EventBus.Messages.Events.BasketCheckoutItem
            {
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList();

            await _publishEndpoint.Publish(checkoutEvent);
            await _repository.DeleteBasket(checkoutEvent.UserName);

            return Accepted();
        }
    }
}