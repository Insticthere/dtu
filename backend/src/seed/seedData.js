require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const connectDB = require('../config/db');

const User = require('../models/User');
const InstrumentCategory = require('../models/InstrumentCategory');
const Instrument = require('../models/Instrument');
const Application = require('../models/Application');
const InspectionRecord = require('../models/InspectionRecord');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const { generateCertificatePDF } = require('../services/certificateService');

const seedCategories = [
  {
    name: 'Electronic Weighing Scale (Class III)',
    code: 'SCALE_CL3',
    description: 'Commercial electronic weighing instruments used in retail trade, mandi transactions, and general warehousing.',
    verificationValidityMonths: 12,
    applicableStandard: 'Legal Metrology (General) Rules 2011, Schedule VIII',
    specSchema: [
      { id: 'maxCapacityKg', label: 'Maximum Capacity (Max)', type: 'number', unit: 'kg', required: true, default: 30 },
      { id: 'minCapacityG', label: 'Minimum Capacity (Min)', type: 'number', unit: 'g', required: true, default: 100 },
      { id: 'verificationIntervalE', label: 'Verification Scale Interval (e)', type: 'number', unit: 'g', required: true, default: 5 },
      { id: 'accuracyClass', label: 'Accuracy Class', type: 'select', options: ['Class I (Special)', 'Class II (High)', 'Class III (Medium)', 'Class IIII (Ordinary)'], default: 'Class III (Medium)', required: true },
      { id: 'platformDimension', label: 'Platform Dimension (LxW)', type: 'text', unit: 'mm', required: false, default: '400 x 400 mm' }
    ],
    inspectionSchema: [
      {
        id: 'visual_inspection',
        label: 'Visual & Physical Condition (Seals, Level Indicator, Stamping Plaque)',
        type: 'select',
        options: ['Pass', 'Fail'],
        required: true,
        description: 'Check spirit level indicator, metallic stamping plaque, and lead-and-wire seal integrity.'
      },
      {
        id: 'zero_setting_test',
        label: 'Zero Setting & Tare Accuracy Test',
        type: 'select',
        options: ['Pass', 'Fail'],
        required: true,
        description: 'Verify zero indication within ± 0.25 e.'
      },
      {
        id: 'reading_at_min_load',
        label: 'Tolerance Test Reading at Minimum Load (g)',
        type: 'number',
        unit: 'g',
        required: true,
        description: 'Apply minimum load and record observed reading.'
      },
      {
        id: 'reading_at_half_capacity',
        label: 'Tolerance Test Reading at 50% Capacity (kg)',
        type: 'number',
        unit: 'kg',
        required: true,
        description: 'Apply 50% Max capacity standard test weights.'
      },
      {
        id: 'reading_at_max_capacity',
        label: 'Tolerance Test Reading at 100% Maximum Capacity (kg)',
        type: 'number',
        unit: 'kg',
        required: true,
        description: 'Apply 100% Max standard test weights.'
      },
      {
        id: 'eccentricity_error_max',
        label: 'Maximum Eccentricity (Corner Load) Error (g)',
        type: 'number',
        unit: 'g',
        required: true,
        description: 'Place 1/3 Max weight on 4 corners. Maximum error must not exceed MPE.'
      },
      {
        id: 'repeatability_test',
        label: 'Repeatability Test (3 consecutive loadings)',
        type: 'select',
        options: ['Pass', 'Fail'],
        required: true,
        description: 'Difference between any two results shall not be greater than absolute value of MPE.'
      }
    ]
  },
  {
    name: 'Evidential Breath Analyser (EBA)',
    code: 'BREATH_ANL',
    description: 'Evidential breath alcohol testing instruments used by traffic police, hospitals & forensic labs.',
    verificationValidityMonths: 6,
    applicableStandard: 'OIML R 126 & Legal Metrology Rules, 2011',
    specSchema: [
      { id: 'measuringPrinciple', label: 'Sensor Technology', type: 'select', options: ['Fuel Cell Electrochemical', 'Dual Infrared + Electrochemical', 'Spectrophotometric'], default: 'Dual Infrared + Electrochemical', required: true },
      { id: 'measurementRange', label: 'Measurement Range', type: 'text', unit: 'mg/100ml BAC', default: '0 to 500 mg/100ml', required: true },
      { id: 'operatingTemp', label: 'Operating Temperature Range', type: 'text', default: '0°C to 45°C' }
    ],
    inspectionSchema: [
      {
        id: 'visual_tamper_check',
        label: 'Tamper-Evident Security Seal & Memory Integrity',
        type: 'select',
        options: ['Pass', 'Fail'],
        required: true,
        description: 'Verify internal calibration audit counter and unbroken physical seals.'
      },
      {
        id: 'accuracy_conc_low',
        label: 'Accuracy at Low Concentration (0.020% BAC / 20 mg/100ml)',
        type: 'number',
        unit: 'mg/100ml',
        required: true,
        description: 'Permissible error: ± 2.0 mg/100ml.'
      },
      {
        id: 'accuracy_conc_medium',
        label: 'Accuracy at Legal Limit Concentration (0.050% BAC / 50 mg/100ml)',
        type: 'number',
        unit: 'mg/100ml',
        required: true,
        description: 'Permissible error: ± 5% of nominal value.'
      },
      {
        id: 'accuracy_conc_high',
        label: 'Accuracy at High Concentration (0.080% BAC / 80 mg/100ml)',
        type: 'number',
        unit: 'mg/100ml',
        required: true,
        description: 'Permissible error: ± 5% of nominal value.'
      },
      {
        id: 'drift_check_24h',
        label: '24-Hour Calibration Drift Check (%)',
        type: 'number',
        unit: '%',
        required: true,
        description: 'Drift between readings must not exceed 1.5%.'
      },
      {
        id: 'blank_sample_zero_test',
        label: 'Blank Alcohol-Free Sample Test (Zero Baseline)',
        type: 'select',
        options: ['Pass', 'Fail'],
        required: true,
        description: 'Instrument must strictly indicate 0.00 mg/100ml with ambient air / blank gas.'
      }
    ]
  },
  {
    name: 'Automatic Fuel Dispenser (Petrol / Diesel Pump)',
    code: 'FUEL_DISP',
    description: 'Retail dispensing units for motor vehicle fuels with electronic price totalizers.',
    verificationValidityMonths: 12,
    applicableStandard: 'Legal Metrology Rules 2011, Schedule IX',
    specSchema: [
      { id: 'fuelType', label: 'Fuel Type Dispensed', type: 'select', options: ['Motor Spirit (Petrol)', 'High Speed Diesel (HSD)', 'Compressed Natural Gas (CNG)', 'LPG Auto'], default: 'Motor Spirit (Petrol)', required: true },
      { id: 'maxFlowRate', label: 'Maximum Flow Rate', type: 'number', unit: 'L/min', default: 50, required: true },
      { id: 'nozzleCount', label: 'Number of Dispensing Nozzles', type: 'number', default: 2, required: true }
    ],
    inspectionSchema: [
      {
        id: 'meter_security_seal',
        label: 'Pulsar & Pulser Gear Box Totalizer Security Seal Check',
        type: 'select',
        options: ['Pass', 'Fail'],
        required: true,
        description: 'Verify intact state legal metrology lead seals on pulser and electronic totalizer board.'
      },
      {
        id: 'delivery_error_5L',
        label: 'Delivery Error at 5 Litre Standard Conical Measure (ml)',
        type: 'number',
        unit: 'ml',
        required: true,
        description: 'Tolerance: Maximum Permissible Error ± 25 ml on 5 Litres.'
      },
      {
        id: 'delivery_error_10L',
        label: 'Delivery Error at 10 Litre Standard Conical Measure (ml)',
        type: 'number',
        unit: 'ml',
        required: true,
        description: 'Tolerance: Maximum Permissible Error ± 50 ml on 10 Litres.'
      },
      {
        id: 'delivery_error_20L',
        label: 'Delivery Error at 20 Litre Standard Conical Measure (ml)',
        type: 'number',
        unit: 'ml',
        required: true,
        description: 'Tolerance: Maximum Permissible Error ± 100 ml on 20 Litres.'
      },
      {
        id: 'totalizer_synchronization',
        label: 'Electronic vs Mechanical Totalizer Volume Match',
        type: 'select',
        options: ['Pass', 'Fail'],
        required: true,
        description: 'Ensure digital display and mechanical totalizer are synchronized to within 0.01 Litres.'
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections for fresh seed...');
    await User.deleteMany({});
    await InstrumentCategory.deleteMany({});
    await Instrument.deleteMany({});
    await Application.deleteMany({});
    await InspectionRecord.deleteMany({});
    await Certificate.deleteMany({});
    await Notification.deleteMany({});

    console.log('1. Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    const admin = await User.create({
      name: 'Dr. Alok Srivastava (Admin)',
      email: 'admin@metrology.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'admin',
      phone: '+91 98110 01100',
      badgeNumber: 'LM-HQ-ADMIN-01',
      jurisdictionDistrict: 'National Capital Region',
      orgDetails: {
        companyName: 'Directorate of Legal Metrology, GoI',
        address: 'Krishi Bhawan, Rajendra Prasad Road',
        district: 'New Delhi',
        state: 'Delhi',
      }
    });

    const lmo = await User.create({
      name: 'R. K. Verma (Inspector)',
      email: 'lmo.verma@metrology.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'lmo',
      phone: '+91 98711 22334',
      badgeNumber: 'LMO-DL-401',
      jurisdictionDistrict: 'Central Delhi',
      orgDetails: {
        companyName: 'Office of the Assistant Controller of Legal Metrology',
        address: 'Vikas Bhawan, IP Estate',
        district: 'Central Delhi',
        state: 'Delhi',
      }
    });

    const gatc = await User.create({
      name: 'Apex Metrology Testing Centre',
      email: 'gatc.lab@testcentre.org',
      passwordHash: defaultPasswordHash,
      role: 'gatc',
      phone: '+91 99100 44556',
      badgeNumber: 'GATC-DL-08',
      jurisdictionDistrict: 'South Delhi',
      orgDetails: {
        companyName: 'Apex Precision Testing Laboratory Pvt Ltd',
        gstNumber: '07AAACA1234F1Z8',
        address: 'Okhla Industrial Area Phase III',
        district: 'South Delhi',
        state: 'Delhi',
      }
    });

    const user1 = await User.create({
      name: 'Ramesh Sharma',
      email: 'ramesh.traders@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'user',
      phone: '+91 98101 23456',
      orgDetails: {
        companyName: 'Ramesh Kirana & Wholesale Commodities',
        gstNumber: '07AAAAA0000A1Z5',
        address: 'Shop No. 42, Khari Baoli, Chandni Chowk',
        district: 'Central Delhi',
        state: 'Delhi',
      }
    });

    const user2 = await User.create({
      name: 'Dr. Sunita Deshmukh',
      email: 'delhi.hospital@medhealth.in',
      passwordHash: defaultPasswordHash,
      role: 'user',
      phone: '+91 98202 34567',
      orgDetails: {
        companyName: 'City Trauma & Emergency Medical Services',
        gstNumber: '07BBBBB1111B1Z2',
        address: 'Institutional Area, Saket',
        district: 'South Delhi',
        state: 'Delhi',
      }
    });

    console.log('2. Seeding Instrument Categories...');
    const createdCategories = await InstrumentCategory.insertMany(seedCategories);
    const catScale = createdCategories.find(c => c.code === 'SCALE_CL3');
    const catBreath = createdCategories.find(c => c.code === 'BREATH_ANL');
    const catFuel = createdCategories.find(c => c.code === 'FUEL_DISP');

    console.log('3. Seeding Instruments...');
    const instScale = await Instrument.create({
      ownerId: user1._id,
      categoryId: catScale._id,
      make: 'Essae-Teraoka',
      model: 'DS-215 High Precision',
      serialNumber: 'ESS-2024-8841',
      specs: {
        maxCapacityKg: 30,
        minCapacityG: 100,
        verificationIntervalE: 5,
        accuracyClass: 'Class III (Medium)',
        platformDimension: '350 x 300 mm'
      },
      location: {
        premisesName: 'Main Cashier Counter 1',
        address: 'Shop No. 42, Khari Baoli, Chandni Chowk',
        district: 'Central Delhi',
        state: 'Delhi',
        pinCode: '110006',
        coordinates: { lat: 28.6562, lng: 77.2285 }
      },
      status: 'active'
    });

    const instBreath = await Instrument.create({
      ownerId: user2._id,
      categoryId: catBreath._id,
      make: 'Dräger Safety',
      model: 'Alcotest 7510 Evidential',
      serialNumber: 'DRG-ALC-99201',
      specs: {
        measuringPrinciple: 'Dual Infrared + Electrochemical',
        measurementRange: '0 to 500 mg/100ml',
        operatingTemp: '0°C to 45°C'
      },
      location: {
        premisesName: 'Trauma Toxicology Lab',
        address: 'City Trauma Center, Saket',
        district: 'South Delhi',
        state: 'Delhi',
        pinCode: '110017',
        coordinates: { lat: 28.5245, lng: 77.2066 }
      },
      status: 'active'
    });

    const instFuel = await Instrument.create({
      ownerId: user1._id,
      categoryId: catFuel._id,
      make: 'Tokheim Midco',
      model: 'Quantium 510 Multi-Product',
      serialNumber: 'TKH-MPD-55092',
      specs: {
        fuelType: 'Motor Spirit (Petrol)',
        maxFlowRate: 50,
        nozzleCount: 4
      },
      location: {
        premisesName: 'Highway Fuel Station Dispenser Bay 2',
        address: 'GT Karnal Road, Alipur',
        district: 'North Delhi',
        state: 'Delhi',
        pinCode: '110036',
        coordinates: { lat: 28.7972, lng: 77.1325 }
      },
      status: 'pending_verification'
    });

    console.log('4. Seeding Applications & Completed Inspections...');
    
    // Application 1: Scale -> Certified
    const app1Id = new mongoose.Types.ObjectId();
    const app1Number = 'APP-2026-SC01';
    const cert1Number = 'LM-VER-2026-908123';
    const qrToken1 = '4f8a92e10bc78d234a5b6c7d8e9f0123';
    const baseUrl = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const verificationUrl1 = `${baseUrl}/verify/${qrToken1}`.replace(/([^:]\/)\/+/g, '$1');

    const validUntil1 = new Date();
    validUntil1.setMonth(validUntil1.getMonth() + 11);

    const cert1 = await Certificate.create({
      applicationId: app1Id,
      certificateNumber: cert1Number,
      qrToken: qrToken1,
      issuedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      validUntil: validUntil1,
      verificationValidityMonths: 12,
      status: 'Active',
      issuingAuthority: {
        officerName: lmo.name,
        officerRole: 'lmo',
        badgeNumber: lmo.badgeNumber,
        jurisdiction: lmo.jurisdictionDistrict
      },
      verificationUrl: verificationUrl1,
    });

    const insp1 = await InspectionRecord.create({
      applicationId: app1Id,
      officerId: lmo._id,
      observations: {
        visual_inspection: 'Pass',
        zero_setting_test: 'Pass',
        reading_at_min_load: 100.0,
        reading_at_half_capacity: 15.000,
        reading_at_max_capacity: 30.000,
        eccentricity_error_max: 0.1,
        repeatability_test: 'Pass'
      },
      result: 'Pass',
      remarks: 'All tolerance test checkpoints within Legal Metrology Schedule VIII limits. Lead security seal serial DL-SEAL-883 affixed.',
      environmentalConditions: {
        temperatureC: 24.5,
        relativeHumidityPct: 48,
        barometricPressureHPa: 1013
      },
      workingStandardsUsed: [
        { standardName: 'F2 Class Working Standard Weights Set (1g to 20kg)', certificateRef: 'NPL/STD/2025/4412', validUntil: new Date('2027-01-01') }
      ],
      conductedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    const app1 = await Application.create({
      _id: app1Id,
      applicationNumber: app1Number,
      instrumentId: instScale._id,
      userId: user1._id,
      applicationType: 'initial_verification',
      status: 'Certified',
      assignedOfficerId: lmo._id,
      assignedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      scheduledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      inspectionVenue: 'on_site',
      inspectionRecordId: insp1._id,
      certificateId: cert1._id,
      timeline: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), performedBy: user1._id, note: 'Online verification application submitted.' },
        { status: 'Scheduled', timestamp: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000), performedBy: lmo._id, note: 'Inspection scheduled for on-site visit.' },
        { status: 'Certified', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), performedBy: lmo._id, note: 'Verified and Certificate LM-VER-2026-908123 generated.' }
      ]
    });

    try {
      const pdf1 = await generateCertificatePDF({
        certificate: cert1,
        application: app1,
        instrument: instScale,
        category: catScale,
        user: user1,
        inspection: insp1
      });
      cert1.pdfPath = pdf1;
      await cert1.save();
    } catch (e) {
      console.log('PDF generation skipped in seed:', e.message);
    }

    instScale.activeCertificateId = cert1._id;
    await instScale.save();

    // Application 2: Breath Analyser -> Certified by GATC
    const app2Id = new mongoose.Types.ObjectId();
    const app2Number = 'APP-2026-BA02';
    const cert2Number = 'LM-VER-2026-447819';
    const qrToken2 = '8c2f1a7b9e0d456789abcdef11223344';
    const verificationUrl2 = `${baseUrl}/verify/${qrToken2}`.replace(/([^:]\/)\/+/g, '$1');

    const validUntil2 = new Date();
    validUntil2.setMonth(validUntil2.getMonth() + 5);

    const cert2 = await Certificate.create({
      applicationId: app2Id,
      certificateNumber: cert2Number,
      qrToken: qrToken2,
      issuedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      validUntil: validUntil2,
      verificationValidityMonths: 6,
      status: 'Active',
      issuingAuthority: {
        officerName: 'Dr. K. Ramanathan (GATC Lead)',
        officerRole: 'gatc',
        badgeNumber: 'GATC-DL-08',
        jurisdiction: 'South Delhi'
      },
      verificationUrl: verificationUrl2,
    });

    const insp2 = await InspectionRecord.create({
      applicationId: app2Id,
      officerId: gatc._id,
      observations: {
        visual_tamper_check: 'Pass',
        accuracy_conc_low: 20.1,
        accuracy_conc_medium: 50.4,
        accuracy_conc_high: 80.2,
        drift_check_24h: 0.8,
        blank_sample_zero_test: 'Pass'
      },
      result: 'Pass',
      remarks: 'Laboratory calibration against certified dry gas standards confirmed accuracy well within OIML R126 MPE limits.',
      environmentalConditions: {
        temperatureC: 21.0,
        relativeHumidityPct: 45,
        barometricPressureHPa: 1015
      },
      workingStandardsUsed: [
        { standardName: 'Certified Ethanol Dry Gas Standard Cylinder 0.050% BAC', certificateRef: 'NIST/TRACE/2025/901', validUntil: new Date('2026-12-31') }
      ],
      conductedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    const app2 = await Application.create({
      _id: app2Id,
      applicationNumber: app2Number,
      instrumentId: instBreath._id,
      userId: user2._id,
      applicationType: 'initial_verification',
      status: 'Certified',
      assignedOfficerId: gatc._id,
      assignedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      scheduledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      inspectionVenue: 'gatc_centre',
      inspectionRecordId: insp2._id,
      certificateId: cert2._id,
      timeline: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), performedBy: user2._id, note: 'GATC calibration request submitted.' },
        { status: 'Scheduled', timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), performedBy: gatc._id, note: 'Scheduled for precision laboratory testing.' },
        { status: 'Certified', timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), performedBy: gatc._id, note: 'Testing passed. Certificate LM-VER-2026-447819 issued.' }
      ]
    });

    try {
      const pdf2 = await generateCertificatePDF({
        certificate: cert2,
        application: app2,
        instrument: instBreath,
        category: catBreath,
        user: user2,
        inspection: insp2
      });
      cert2.pdfPath = pdf2;
      await cert2.save();
    } catch (e) {}

    instBreath.activeCertificateId = cert2._id;
    await instBreath.save();

    // Application 3: Fuel Dispenser -> Scheduled / Ready for live inspection
    const app3Number = 'APP-2026-FD03';
    const app3 = await Application.create({
      applicationNumber: app3Number,
      instrumentId: instFuel._id,
      userId: user1._id,
      applicationType: 'initial_verification',
      status: 'Scheduled',
      assignedOfficerId: lmo._id,
      assignedAt: new Date(),
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      inspectionVenue: 'on_site',
      applicantRemarks: 'Please verify newly installed diesel/petrol dual nozzle dispensing unit.',
      timeline: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), performedBy: user1._id, note: 'Initial verification requested.' },
        { status: 'Scheduled', timestamp: new Date(), performedBy: lmo._id, note: 'Scheduled for field inspection by LMO.' }
      ]
    });

    console.log('5. Seeding Notifications...');
    await Notification.create([
      {
        userId: user1._id,
        type: 'status_update',
        title: 'Application Scheduled',
        message: `Your application #${app3Number} for Tokheim Midco Fuel Dispenser has been scheduled for inspection on ${app3.scheduledDate.toLocaleDateString('en-IN')}.`,
        relatedInstrumentId: instFuel._id,
        relatedApplicationId: app3._id,
        read: false
      },
      {
        userId: user1._id,
        type: 'status_update',
        title: 'Certificate Issued',
        message: `Certificate #${cert1Number} issued for your Essae-Teraoka Weighing Scale.`,
        relatedInstrumentId: instScale._id,
        relatedCertificateId: cert1._id,
        read: true
      },
      {
        userId: user2._id,
        type: 'status_update',
        title: 'GATC Calibration Certified',
        message: `Certificate #${cert2Number} issued for Dräger Alcotest 7510.`,
        relatedInstrumentId: instBreath._id,
        relatedCertificateId: cert2._id,
        read: false
      }
    ]);

    console.log('\n======================================================');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Sample User Credentials (all passwords: password123):');
    console.log('1. Admin:   admin@metrology.gov.in');
    console.log('2. LMO:     lmo.verma@metrology.gov.in');
    console.log('3. GATC:    gatc.lab@testcentre.org');
    console.log('4. User 1:  ramesh.traders@gmail.com');
    console.log('5. User 2:  delhi.hospital@medhealth.in');
    console.log('------------------------------------------------------');
    console.log(`Sample Public QR Token: ${qrToken1}`);
    console.log(`Sample Public Verification URL: /verify/${qrToken1}`);
    console.log('======================================================\n');

    return true;
  } catch (err) {
    console.error('Seed Error:', err);
    throw err;
  }
};

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedDatabase;
