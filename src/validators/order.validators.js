const Joi = require('joi');

const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().required().min(1)
    })
  ).required().min(1)
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled').required()
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema
}; 