const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000/api';
const FRONTEND_URL = 'http://localhost:5173';

// Test scenarios
const scenarios = [
  {
    name: 'Login & Dashboard (Light)',
    requests: [
      { method: 'POST', path: '/auth/login', body: { email: 'admin@test.com', password: 'password' } },
      { method: 'GET', path: '/employee-skills/matrix' }
    ]
  },
  {
    name: 'Skills Management (Medium)',
    requests: [
      { method: 'GET', path: '/skills' },
      { method: 'GET', path: '/employee-skills/my-skills' },
      { method: 'GET', path: '/employee-skills/matrix' },
      { method: 'GET', path: '/employee-skills/org-tree' }
    ]
  },
  {
    name: 'Team Management (Heavy)',
    requests: [
      { method: 'GET', path: '/users' },
      { method: 'GET', path: '/employee-skills/matrix' },
      { method: 'GET', path: '/skills' }
    ]
  }
];

class LoadTester {
  constructor() {
    this.results = {
      scenarios: {},
      summary: {
        totalRequests: 0,
        totalErrors: 0,
        totalTime: 0,
        avgResponseTime: 0
      }
    };
  }

  async request(method, url, body = null, timeout = 30000) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        timeout: timeout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        }
      };

      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.request(options, (res) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            responseTime: responseTime,
            success: res.statusCode < 500
          });
        });
      });

      req.on('error', () => {
        const endTime = performance.now();
        resolve({
          status: 0,
          responseTime: endTime - startTime,
          success: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 0,
          responseTime: timeout,
          success: false
        });
      });

      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  async runScenario(scenario, concurrentUsers, duration = 60000) {
    console.log(`\n📊 Running: ${scenario.name}`);
    console.log(`👥 Concurrent Users: ${concurrentUsers}`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(0)}s`);
    console.log(''.padEnd(50, '─'));

    const results = [];
    const startTime = Date.now();
    let requestCount = 0;
    let errorCount = 0;

    const makeRequests = async () => {
      while (Date.now() - startTime < duration) {
        for (const req of scenario.requests) {
          const url = `${BASE_URL}${req.path}`;
          const result = await this.request(req.method, url, req.body);
          results.push(result);
          requestCount++;

          if (!result.success) errorCount++;
          process.stdout.write(`\r✓ Requests: ${requestCount} | Errors: ${errorCount}`);
        }
      }
    };

    // Run concurrent users
    const promises = [];
    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(makeRequests());
    }

    await Promise.all(promises);

    // Calculate statistics
    const responseTimes = results.map(r => r.responseTime);
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    const p95Time = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
    const p99Time = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)];
    const throughput = (requestCount / (duration / 1000)).toFixed(2);

    this.results.scenarios[scenario.name] = {
      concurrentUsers,
      totalRequests: requestCount,
      totalErrors: errorCount,
      errorRate: ((errorCount / requestCount) * 100).toFixed(2),
      avgResponseTime: avgTime.toFixed(2),
      minResponseTime: minTime.toFixed(2),
      maxResponseTime: maxTime.toFixed(2),
      p95ResponseTime: p95Time.toFixed(2),
      p99ResponseTime: p99Time.toFixed(2),
      throughput: `${throughput} req/s`
    };

    console.log(`\n✅ Results:`);
    console.log(`   Total Requests: ${requestCount}`);
    console.log(`   Total Errors: ${errorCount} (${((errorCount / requestCount) * 100).toFixed(2)}%)`);
    console.log(`   Avg Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min/Max: ${minTime.toFixed(2)}ms / ${maxTime.toFixed(2)}ms`);
    console.log(`   P95/P99: ${p95Time.toFixed(2)}ms / ${p99Time.toFixed(2)}ms`);
    console.log(`   Throughput: ${throughput} req/s`);
  }

  async runAllTests() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║     SKILL MATRIX LOAD TEST REPORT                  ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`\n🚀 Server: ${BASE_URL}`);
    console.log(`📅 Started: ${new Date().toISOString()}`);

    // Test different load scenarios
    await this.runScenario(scenarios[0], 5, 30000);  // 5 concurrent users, 30s
    await this.runScenario(scenarios[0], 10, 30000); // 10 concurrent users, 30s
    await this.runScenario(scenarios[0], 25, 30000); // 25 concurrent users, 30s
    await this.runScenario(scenarios[1], 50, 30000); // 50 concurrent users, 30s
    await this.runScenario(scenarios[2], 100, 30000); // 100 concurrent users, 30s

    this.printSummary();
  }

  printSummary() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║            LOAD TEST SUMMARY REPORT                ║');
    console.log('╚════════════════════════════════════════════════════╝');

    console.log('\n📊 SCENARIO RESULTS:');
    console.log(''.padEnd(140, '─'));
    console.log(
      'Scenario'.padEnd(30) +
      'Users'.padEnd(10) +
      'Requests'.padEnd(12) +
      'Errors'.padEnd(10) +
      'Avg (ms)'.padEnd(12) +
      'P95 (ms)'.padEnd(12) +
      'P99 (ms)'.padEnd(12) +
      'Throughput'.padEnd(15)
    );
    console.log(''.padEnd(140, '─'));

    for (const [name, data] of Object.entries(this.results.scenarios)) {
      console.log(
        name.padEnd(30) +
        data.concurrentUsers.toString().padEnd(10) +
        data.totalRequests.toString().padEnd(12) +
        `${data.totalErrors}(${data.errorRate}%)`.padEnd(10) +
        data.avgResponseTime.padEnd(12) +
        data.p95ResponseTime.padEnd(12) +
        data.p99ResponseTime.padEnd(12) +
        data.throughput.padEnd(15)
      );
    }
    console.log(''.padEnd(140, '─'));

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('✓ Test completed successfully');
    console.log('✓ Check response times and error rates above');
    console.log('✓ For production, monitor these metrics continuously');
    console.log('✓ Consider implementing caching for frequently accessed endpoints');
    console.log('✓ Use database connection pooling for better concurrent performance');
    console.log('✓ Implement rate limiting to prevent abuse');
    console.log(`\n📅 Completed: ${new Date().toISOString()}\n`);
  }
}

// Run the tests
const tester = new LoadTester();
tester.runAllTests().catch(console.error);
