// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Biz Boost API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Biz Boost backend',
    },
    servers: [
      { url: 'http://localhost:5500/api' }, {url: 'https://bizboostcom.vercel.app'}
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Path to all route files with Swagger annotations
  apis: [
    './routes/authRoutes.js',
    './routes/dashboardRoutes.js',
    './routes/customerRoutes.js',
    './routes/inventoryRoutes.js',
    './routes/salesRoutes.js',
    './routes/deliveryRoutes.js',
    './routes/supplierRoutes.js',
    './routes/settingsRoutes.js',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
