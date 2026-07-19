const fs = require('fs');
const path = require('path');
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

// Dynamically find all route files in src/modules
const modulesDir = path.join(__dirname, 'src', 'modules');
if (fs.existsSync(modulesDir)) {
  const folders = fs.readdirSync(modulesDir);
  for (const folder of folders) {
    const folderPath = path.join(modulesDir, folder);
    if (fs.statSync(folderPath).isDirectory()) {
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        if (file.endsWith('.routes.js')) {
          routes.push(`./src/modules/${folder}/${file}`);
        }
      }
    }
  }
}

swaggerAutogen(outputFile, routes, doc).then(() => {
  console.log('Swagger documentation generated successfully!');
});
