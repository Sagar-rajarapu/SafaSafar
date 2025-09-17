#!/usr/bin/env node

/**
 * Simple script to test route functionality without running the full server
 * Usage: node test-routes.js [route-name]
 */

const path = require('path');

// Available routes for testing
const routes = {
  'hybrid': './routes/hybrid.routes.js',
  'auth': './routes/auth.js',
  'tourist': './routes/tourist.routes.js',
  'blockchain': './routes/blockchain.routes.js',
  'admin': './routes/admin.routes.js'
};

const routeName = process.argv[2];

if (!routeName) {
  console.log('Available routes for testing:');
  Object.keys(routes).forEach(name => {
    console.log(`  - ${name}`);
  });
  console.log('\nUsage: node test-routes.js [route-name]');
  process.exit(1);
}

if (!routes[routeName]) {
  console.error(`❌ Route '${routeName}' not found.`);
  console.log('Available routes:', Object.keys(routes).join(', '));
  process.exit(1);
}

console.log(`🧪 Testing ${routeName} route...`);

try {
  const routePath = path.resolve(routes[routeName]);
  const route = require(routePath);
  
  console.log(`✅ ${routeName} route loaded successfully`);
  console.log(`📁 Path: ${routePath}`);
  console.log(`🔗 Type: ${typeof route}`);
  
  if (route.stack) {
    console.log(`📋 Endpoints: ${route.stack.length} routes defined`);
  }
  
} catch (error) {
  console.error(`❌ Error loading ${routeName} route:`, error.message);
  process.exit(1);
}
