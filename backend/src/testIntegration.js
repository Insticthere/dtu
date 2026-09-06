const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const seedDatabase = require('./seed/seedData');
const { runExpiryCheck } = require('./jobs/expiryNotificationJob');

async function runTests() {
  console.log('=== STARTING AUTOMATED END-TO-END INTEGRATION TEST ===');

  await connectDB();
  await seedDatabase();

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099';

  console.log('Server started on test port 5099');

  // Helper for requests
  const request = async (url, options = {}) => {
    const fetchRes = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await fetchRes.json();
    return { status: fetchRes.status, data };
  };

  try {
    // 1. Health check
    console.log('\n[TEST 1] GET /api/health');
    const health = await request('/api/health');
    console.log('Health status:', health.status, health.data.status);
    if (health.status !== 200 || health.data.status !== 'online') throw new Error('Health check failed');

    // 2. Public verification by QR Token
    console.log('\n[TEST 2] GET /api/verify/4f8a92e10bc78d234a5b6c7d8e9f0123');
    const verify = await request('/api/verify/4f8a92e10bc78d234a5b6c7d8e9f0123');
    console.log('Verify result:', verify.status, 'Valid:', verify.data.valid, 'Category:', verify.data.data?.category, 'Masked Owner:', verify.data.data?.maskedOwnerName);
    if (verify.status !== 200 || !verify.data.valid) throw new Error('Public verify failed');

    // 3. User Login
    console.log('\n[TEST 3] POST /api/auth/login');
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ramesh.traders@gmail.com', password: 'password123' })
    });
    console.log('Login status:', login.status, 'User role:', login.data.user?.role);
    if (login.status !== 200 || !login.data.token) throw new Error('Login failed');
    const userToken = login.data.token;

    // 4. LMO Officer Login
    console.log('\n[TEST 4] Officer Login (lmo.verma@metrology.gov.in)');
    const officerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'lmo.verma@metrology.gov.in', password: 'password123' })
    });
    const officerToken = officerLogin.data.token;

    // 5. List Categories
    console.log('\n[TEST 5] GET /api/categories');
    const cats = await request('/api/categories');
    console.log('Categories count:', cats.data.count);
    const catScale = cats.data.categories.find(c => c.code === 'SCALE_CL3');
    if (!catScale) throw new Error('Categories not found');

    // 6. User registers a new instrument
    console.log('\n[TEST 6] POST /api/instruments (User adds new Weighing Scale)');
    const newInst = await request('/api/instruments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        categoryId: catScale._id,
        make: 'Avery Weigh-Tronix',
        model: 'ZK830 High Precision',
        serialNumber: `TEST-SN-${Date.now()}`,
        specs: { maxCapacityKg: 50, accuracyClass: 'Class III (Medium)' },
        location: {
          premisesName: 'Grain Warehouse Bay 1',
          address: 'Narela Mandi Yard',
          district: 'North Delhi',
          state: 'Delhi'
        }
      })
    });
    console.log('Instrument status:', newInst.status, 'ID:', newInst.data.instrument?._id);
    const instId = newInst.data.instrument._id;

    // 7. User submits verification application
    console.log('\n[TEST 7] POST /api/applications (Submit Verification)');
    const newApp = await request('/api/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        instrumentId: instId,
        applicationType: 'initial_verification',
        inspectionVenue: 'on_site',
        applicantRemarks: 'Please verify newly commissioned scale'
      })
    });
    console.log('Application status:', newApp.status, 'App Number:', newApp.data.application?.applicationNumber);
    const appId = newApp.data.application._id;

    // 8. Officer schedules inspection
    console.log('\n[TEST 8] PATCH /api/applications/:id/schedule');
    const schedule = await request(`/api/applications/${appId}/schedule`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({
        scheduledDate: new Date(),
        officerRemarks: 'Assigned for inspection today'
      })
    });
    console.log('Scheduled status:', schedule.data.application?.status);

    // 9. Officer performs inspection with dynamic observations & Pass verdict
    console.log('\n[TEST 9] POST /api/applications/:id/inspection (Pass & Issue Certificate)');
    const inspect = await request(`/api/applications/${appId}/inspection`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({
        observations: {
          visual_inspection: 'Pass',
          zero_setting_test: 'Pass',
          reading_at_min_load: 100,
          reading_at_half_capacity: 25,
          reading_at_max_capacity: 50,
          eccentricity_error_max: 0.2,
          repeatability_test: 'Pass'
        },
        result: 'Pass',
        remarks: 'All tolerance checkpoints passed. Seal #DL-SEAL-9901 affixed.'
      })
    });
    console.log('Inspection result:', inspect.status, 'Cert Number:', inspect.data.certificate?.certificateNumber, 'QR Token:', inspect.data.certificate?.qrToken);
    const issuedQrToken = inspect.data.certificate?.qrToken;

    // 10. Verify the newly issued certificate publicly
    console.log('\n[TEST 10] GET /api/verify/:qrToken (Verify Newly Issued Certificate)');
    const verifyNew = await request(`/api/verify/${issuedQrToken}`);
    console.log('Verify newly issued status:', verifyNew.status, 'Valid:', verifyNew.data.valid, 'Owner:', verifyNew.data.data?.maskedOwnerName);
    if (!verifyNew.data.valid) throw new Error('New certificate verification failed');

    // 11. Run background expiry notification job
    console.log('\n[TEST 11] Trigger Background Expiry Notification Job');
    await runExpiryCheck();

    console.log('\n======================================================');
    console.log('ALL 11 END-TO-END INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    server.close();
    process.exit(1);
  }
}

runTests();
