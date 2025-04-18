const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  price: Joi.number().required().min(0),
  stock: Joi.number().integer().required().min(0),
  category: Joi.string().required()
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  price: Joi.number().min(0),
  stock: Joi.number().integer().min(0),
  category: Joi.string()
}).min(1);

module.exports = {
  createProductSchema,
  updateProductSchema
}; 