using Basket.API.Models;
using Basket.API.Repositories;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using EventBus.Messages.Events;

namespace Basket.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BasketController : ControllerBase
    {
        private readonly IBasketRepository _repository;
        private readonly IPublishEndpoint _publishEndpoint;

        [HttpGet("{userName}")]
        public async Task<IActionResult> GetBasket(string userName)
        {
            var basket = await _repository.GetBasket(userName);
            return Ok(basket ?? new BasketCart(userName));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateBasket(BasketCart basket)
        {
            return Ok(await _repository.UpdateBasket(basket));
        }

        [HttpDelete("{userName}")]
        public async Task<IActionResult> DeleteBasket(string userName)
        {
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
            var basket = await _repository.GetBasket(checkoutEvent.UserName);
            if (basket == null) return NotFound();

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