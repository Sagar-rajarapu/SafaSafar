#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for Digital ID Application
 * 
 * This script tests all major API endpoints to ensure proper functionality
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3,
  verbose: true
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Digital-ID-API-Tester/1.0',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Run a single test
 */
async function runTest(testName, testFunction) {
  testResults.total++;
  
  if (TEST_CONFIG.verbose) {
    console.log(`\n🧪 Testing: ${testName}`);
  }

  try {
    const result = await testFunction();
    
    if (result.success) {
      testResults.passed++;
      testResults.details.push({
        name: testName,
        status: 'PASSED',
        details: result.details
      });
      
      if (TEST_CONFIG.verbose) {
        console.log(`✅ ${testName}: PASSED`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
      }
    } else {
      testResults.failed++;
      testResults.details.push({
        name: testName,
        status: 'FAILED',
        error: result.error,
        details: result.details
      });
      
      console.log(`❌ ${testName}: FAILED`);
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      name: testName,
      status: 'ERROR',
      error: error.message
    });
    
    console.log(`💥 ${testName}: ERROR`);
    console.log(`   ${error.message}`);
  }
}

/**
 * Test functions
 */
const tests = {
  // Health and Status Tests
  async healthCheck() {
    const response = await makeRequest(`${BASE_URL}/health`);
    return {
      success: response.statusCode === 200 && response.data.status === 'operational',
      details: `Status: ${response.data.status}, Services: ${Object.keys(response.data.services).length}`
    };
  },

  async authStatus() {
    const response = await makeRequest(`${API_BASE}/auth/status`);
    return {
      success: response.statusCode === 200 && response.data.success === true,
      details: `Overall Health: ${response.data.overallHealth}`
    };
  },

  async hybridHealth() {
    const response = await makeRequest(`${API_BASE}/hybrid/health`);
    return {
      success: response.statusCode === 200,
      details: `Mongo: ${response.data.status.mongo}, Supabase: ${response.data.status.supabase}`
    };
  },

  // Authentication Tests
  async userRegistration() {
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
      phone: '+1234567890'
    };

    const response = await makeRequest(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: testUser
    });

    return {
      success: response.statusCode === 201 && response.data.success === true,
      details: `User ID: ${response.data.data?.user?.id}`,
      data: response.data
    };
  },

  async userLogin() {
    // First register a user
    const testUser = {
      name: 'Login Test User',
      email: `logintest${Date.now()}@example.com`,
      password: 'testpassword123'
    };

    await makeRequest(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: testUser
    });

    // Then try to login
    const response = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password
      }
    });

    return {
      success: response.statusCode === 200 && response.data.success === true,
      details: `Token generated: ${!!response.data.data?.token}`
    };
  },

  // Government API Tests (Mock Mode)
  async aadhaarVerification() {
    const response = await makeRequest(`${API_BASE}/auth/aadhaar/verify`, {
      method: 'POST',
      body: {
        aadhaarNumber: '123456789012',
        otp: '123456'
      }
    });

    return {
      success: response.statusCode === 200 && response.data.success === true,
      details: `Mode: ${response.data.data?.mode}`
    };
  },

  async panVerification() {
    const response = await makeRequest(`${API_BASE}/auth/pan/verify`, {
      method: 'POST',
      body: {
        panNumber: 'ABCDE1234F'
      }
    });

    return {
      success: response.statusCode === 200 && response.data.success === true,
      details: `Mode: ${response.data.data?.mode}`
    };
  },

  async digilockerLogin() {
    const response = await makeRequest(`${API_BASE}/auth/digilocker/login`);
    return {
      success: response.statusCode === 200 && response.data.success === true,
      details: `Mode: ${response.data.data?.mode}`
    };
  },

  // Tourist Management Tests
  async touristProfile() {
    const response = await makeRequest(`${API_BASE}/tourist/profile`, {
      method: 'POST',
      body: {
        name: 'Tourist Test User',
        email: `tourist${Date.now()}@example.com`,
        phone: '+1234567890'
      }
    });

    return {
      success: response.statusCode === 200 && response.data.success === true,
      details: `Tourist created successfully`
    };
  },

  async touristDashboard() {
    const response = await makeRequest(`${API_BASE}/tourist/dashboard/status`);
    return {
      success: response.statusCode === 200,
      details: `Services configured: ${Object.keys(response.data).length}`
    };
  },

  // Blockchain Tests
  async blockchainStatus() {
    const response = await makeRequest(`${API_BASE}/blockchain/status`);
    return {
      success: response.statusCode === 200 && response.data.success === true,
      details: `Connected: ${response.data.data?.connected}`
    };
  },

  // Admin Tests (without authentication for testing)
  async adminHealth() {
    const response = await makeRequest(`${API_BASE}/admin/health`);
    return {
      success: response.statusCode === 200 && response.data.success === true,
      details: `Overall Health: ${response.data.data?.overallHealth}`
    };
  }
};

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Digital ID API Tests...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Base: ${API_BASE}\n`);

  // Run all tests
  for (const [testName, testFunction] of Object.entries(tests)) {
    await runTest(testName, testFunction);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`💥 Errors: ${testResults.details.filter(d => d.status === 'ERROR').length}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`📈 Success Rate: ${successRate}%`);

  if (testResults.failed > 0 || testResults.details.some(d => d.status === 'ERROR')) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(d => d.status !== 'PASSED')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error || 'Unknown error'}`);
      });
  }

  console.log('\n🏁 Testing completed!');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, tests, makeRequest };
