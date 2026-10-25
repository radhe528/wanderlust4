const Joi = require("joi");

const listingSchema = Joi.object({
  title: Joi.string().required()
});

module.exports = { listingSchema };

































