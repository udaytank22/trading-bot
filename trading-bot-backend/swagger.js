const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'TradeMind ERP API',
    description: 'API documentation for TradeMind ERP system',
    version: '1.0.0'
  },
  host: 'localhost:5000',
  basePath: '/api/v1',
  schemes: ['http', 'https'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Standard Authorization header using the Bearer scheme. Example: "Bearer {token}"'
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const outputFile = './swagger-output.json';
const routes = ['./src/server.js']; // Entry point of the Express app

swaggerAutogen(outputFile, routes, doc).then(() => {
  console.log('Swagger documentation generated successfully!');
});
