'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

 const { sanitizeEntity } = require('strapi-utils');

 module.exports = {
   /**
    * Retrieve a record.
    *
    * @return {Object}
    */

   async findOne(ctx) {
     const { slug } = ctx.params;

     const entity = await strapi.services.scraper.findOne({ slug });
     return sanitizeEntity(entity, { model: strapi.models.scraper });
   },
 };
