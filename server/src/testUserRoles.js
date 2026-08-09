const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { User } = require('./models/User');
const { Supervisor } = require('./models/Supervisor');
const { DeliveryAgent } = require('./models/DeliveryAgent');
const { Recycler } = require('./models/Recycler');
const { Wallet } = require('./models/Wallet');
const { findUserByEmail } = require('./utils/findUserByEmail');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected');

  const ts = Date.now();

  // 1. Trial Member
  const trial = await User.create({
    fullName: 'Test Trial User',
    email: `trial_${ts}@test.com`,
    phoneNumber: `90000${ts.toString().slice(-5)}`,
    password: 'password123',
    role: 'citizen',
    membershipStatus: 'trial'
  });
  await Wallet.create({ ownerId: trial._id, ownerModel: 'User' });
  console.log('Created Trial:', trial.email, 'Role:', trial.role, 'Membership:', trial.membershipStatus);

  // 2. Member
  const member = await User.create({
    fullName: 'Test Permanent Member',
    email: `member_${ts}@test.com`,
    phoneNumber: `90001${ts.toString().slice(-5)}`,
    password: 'password123',
    role: 'citizen',
    membershipStatus: 'member',
    membershipPlan: 'monthly'
  });
  await Wallet.create({ ownerId: member._id, ownerModel: 'User' });
  console.log('Created Member:', member.email, 'Role:', member.role, 'Membership:', member.membershipStatus);

  // 3. Supervisor
  const supervisor = await Supervisor.create({
    name: 'Test Supervisor',
    email: `supervisor_${ts}@test.com`,
    phone: `90002${ts.toString().slice(-5)}`,
    password: 'password123',
    employeeId: 'SUP-TEST-1'
  });
  await Wallet.create({ ownerId: supervisor._id, ownerModel: 'Supervisor' });
  console.log('Created Supervisor:', supervisor.email, 'Role:', supervisor.role);

  // 4. Delivery Agent
  const agent = await DeliveryAgent.create({
    name: 'Test Delivery Agent',
    email: `agent_${ts}@test.com`,
    phone: `90003${ts.toString().slice(-5)}`,
    password: 'password123',
    employeeId: 'AGT-TEST-1'
  });
  await Wallet.create({ ownerId: agent._id, ownerModel: 'DeliveryAgent' });
  console.log('Created Delivery Agent:', agent.email, 'Role:', agent.role);

  // 5. Recycler
  const recycler = await Recycler.create({
    companyName: 'Test Recycler Corp',
    contactPerson: 'Test Recycler',
    email: `recycler_${ts}@test.com`,
    phone: `90004${ts.toString().slice(-5)}`,
    password: 'password123',
    licenseNumber: 'LIC-TEST-1'
  });
  await Wallet.create({ ownerId: recycler._id, ownerModel: 'Recycler' });
  console.log('Created Recycler:', recycler.email, 'Role:', recycler.role);

  // Login Verification
  const collections = [
    { model: User, email: trial.email, dashboard: '/citizen' },
    { model: User, email: member.email, dashboard: '/citizen' },
    { model: Supervisor, email: supervisor.email, dashboard: '/supervisor' },
    { model: DeliveryAgent, email: agent.email, dashboard: '/delivery' },
    { model: Recycler, email: recycler.email, dashboard: '/recycler' },
  ];

  console.log('\n--- VERIFYING LOGINS & DASHBOARD TARGET ROLES ---');
  for (const item of collections) {
    const doc = await item.model.findOne({ email: item.email }).select('+password');
    const foundByUtil = await findUserByEmail(item.email);
    const passMatch = await doc.comparePassword('password123');
    console.log(`[LOGIN VERIFIED]: ${item.email} | DB Role: ${doc.role} | Model: ${item.model.modelName} | Target Dashboard: ${item.dashboard} | Password Validated: ${passMatch} | Found by Auth: ${!!foundByUtil}`);
  }

  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
