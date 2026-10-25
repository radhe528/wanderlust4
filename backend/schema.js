// i am adding this in schema.js file in main branch on github not vs code 



const Joi = require("joi");

const listingSchema = Joi.object({
  title: Joi.string().required()
});

module.exports = { listingSchema };



































