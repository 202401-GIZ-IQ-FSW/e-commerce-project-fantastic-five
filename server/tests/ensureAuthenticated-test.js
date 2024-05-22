const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
const User = require('../models/user');
const { expect } = chai;
const bcrypt = require('bcrypt');

chai.use(chaiHttp);

describe('Test ensureAuthenticated middleware', () => {
  let user;

  before(async () => {
    // Create a non-admin user
    const hashedPassword = await bcrypt.hash("customer3", 10);
    user = await User.create({
        name: "Customer-3",
        email: "customer3@customer.com",
        password: hashedPassword
    });
  });

  after(async () => {
    // Clean up the database after tests
    await User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL } });
  });

  it('should return 403 with message Unauthorized the user is not signed in', async () => {
    const agent = chai.request.agent(app);
    const res = await agent.get('/customer/items');
    expect(res).to.have.status(403);
    expect(res.body.message).to.equal("Unauthorized the user is not signed in");
  });

  it('should call next if user is admin', async () => {
    const correctCostumer = {
      email: "customer3@customer.com",
      password: "customer3"
    };

    const agent = chai.request.agent(app);
    await agent.post('/user/signin').send(correctCostumer);
    const res = await agent.get('/customer/items');

    expect(res).to.not.have.status(403);
    expect(res.body).to.be.an("array");
  });
});
