const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const app = require('../index');
const User = require('../models/user');

chai.use(chaiHttp);

describe('Test ensureAdmin middleware', () => {
  let user;

  before(async () => {
    // Create a non-admin user
    user = await User.create({
        name: "Customer-2",
        email: "customer2@customer.com",
        password: "Customer$2"
    });
  });

  after(async () => {
    // Clean up the database after tests
    await User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL } });
  });

  it('should return 403 with message Unauthorized the user is not an admin', async () => {
    const correctCostumer = {
        email: "customer2@customer.com",
        password: "Customer$2"
    };

    const agent = chai.request.agent(app);
    const res1 = await agent.post('/user/signin').send(correctCostumer);
    expect(res1.body.message).to.equal("SignIn Success");

    const res2 = await agent.get('/admin/items');
    expect(res2).to.have.status(403);
    expect(res2.body.message).to.equal("Unauthorized the user is not an admin");
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
