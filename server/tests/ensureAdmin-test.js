const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
const User = require('../models/user');
const { expect } = chai;

chai.use(chaiHttp);

describe('Test ensureAdmin middleware', () => {
  let user;

  before(async () => {
    // Create a non-admin user
    user = await User.create({
        name: "Customer-2",
        email: "customer2@customer.com",
        password:"customer2"
    });
  });

  after(async () => {
    // Clean up the database after tests
    await User.deleteMany({ email: { $eq: 'customer2@customer.com' } });
  });

  it('should return 403 if user is not admin', async () => {
    const correctCostumer = {
        email: "customer2@customer.com",
        password: "customer2",
    };

    const agent = chai.request.agent(app);
    await agent.post('/user/signin').send({
        email: "customer2@customer.com",
        password: "customer2",
    });
    const res = await agent.get('/admin/items');

    expect(res).to.have.status(403);
    expect(res.body.message).to.equal("Unauthorized the user is not an admin");
  });

  it('should call next if user is admin', async () => {
    const adminUser = {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASS
    };
    const agent = chai.request.agent(app);
    await agent.post('/user/signin').send(adminUser);
    const res = await agent.get('/admin/items');
    expect(res).to.not.have.status(403);
    expect(res.body).to.be.an("array");
  });
});
