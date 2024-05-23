const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const app = require('../index');
const User = require('../models/user');
const Item = require('../models/shop-item');

chai.use(chaiHttp);

const agent = chai.request.agent(app);

const adminUser = {
  email: "admin1@example.com",
  password: "Admin1$1234"
};

let itemId;
let customerId;
let mainAdminId;

const shopItem = {
  title: "Eco-Friendly Bamboo Toothbrush",
  image: "https://example.com/images/bamboo_toothbrush.jpg",
  price: 3.99,
  description: "A sustainable toothbrush made from natural bamboo.",
  availableCount: 150,
  genreOrCategory: "Health"
};

const wrongShopItem = {
  title: "",
  image: "https://example.com/images/bamboo_toothbrush.jpg",
  price: 3.99,
  description: "A sustainable toothbrush made from natural bamboo.",
  availableCount: 150,
  genreOrCategory: "Health"
};

before(async () => {
  // Create a non-admin user
  await User.create({
      name: "Customer-4",
      email: "customer4@customer.com",
      password: "Customer$4"
  });
  
  await User.create({
    name: "Customer-5",
    email: "customer5@customer.com",
    password: "Customer$5"
  });

  await User.create({
    name: "Admin1",
    email: "admin1@example.com",
    password: "Admin1$1234",
    isAdmin: true
  });
});

after(async () => {
  const res = await agent.get('/user/signout');
  // console.log("admin route test signout:", await res.body.message)
  // Clean up the database after tests
  await User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL } });
  await Item.deleteMany({});
});

describe('Admin /items route implemented', () => {
  
  it('should through an error if any of items data is not provided', async () => {
    const res1 = await agent.post('/user/signin').send(adminUser);
    // console.log("admin route test signIn:", await res1.body.message)
    const res = await agent.post('/admin/items').send(wrongShopItem);
    expect(res).to.have.status(500);
    expect(res.body.error).to.include("validation failed");
  });

  it('should add items successfully', async () => {
    const res = await agent.post('/admin/items').send(shopItem);
    expect(res).to.have.status(201);
    expect(res.body.title).to.equal(shopItem.title);
    itemId = res.body._id
  });

  it('should get all items successfully', async () => {
    const res = await agent.get('/admin/items');
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
    expect(res.body[0].title).to.equal(shopItem.title);
  });

  it('should through an error if item is not found', async () => {
    const res = await agent.get('/admin/items/664e0f0139dd9c6b36f4811b');
    expect(res).to.have.status(404);
    expect(res.body.error).to.equal("Item not found");
  });

  it('should get a single item successfully', async () => {
    const res = await agent.get(`/admin/items/${itemId}`);
    expect(res).to.have.status(200);
    expect(res.body.title).to.equal(shopItem.title);
  });

  it('should update a single item successfully', async () => {
    const res = await agent.put(`/admin/items/${itemId}`).send({price:1.99});
    expect(res).to.have.status(200);
    expect(res.body.price).to.equal(1.99);
  });

  it('should delete a single item successfully', async () => {
    const res = await agent.delete(`/admin/items/${itemId}`);
    expect(res).to.have.status(200);
    expect(res.body.message).to.equal("Item deleted successfully");
  });

});

describe('Admin /customers route implemented', () => {
  
  it('should get all customers successfully', async () => {
    const res = await agent.get('/admin/customers');
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
    const mainAdmin = await res.body.find(mainAdmin => mainAdmin.email === process.env.ADMIN_EMAIL)
    mainAdminId = mainAdmin._id
    const customer = await res.body.find(customer => customer.name === "Customer-4")
    customerId = customer._id
    expect(customer.name).to.equal("Customer-4");
  });

  it('should through an error if customer is not found', async () => {
    const res = await agent.get('/admin/customers/664e0f0139dd9c6b36f4811b');
    expect(res).to.have.status(404);
    expect(res.body.error).to.equal("Customer not found");
  });

  it('should get a single customer successfully', async () => {
    const res = await agent.get(`/admin/customers/${customerId}`);
    expect(res).to.have.status(200);
    expect(res.body.name).to.equal("Customer-4");
  });

  it('should through an error if trying to delete an Admin', async () => {
    const res = await agent.delete(`/admin/customers/${mainAdminId}`);
    expect(res).to.have.status(404);
    expect(res.body.error).to.equal("Customer not found or customer is admin");
  });

  it('should delete a single customer successfully', async () => {
    const res = await agent.delete(`/admin/customers/${customerId}`);
    expect(res).to.have.status(200);
    expect(res.body.message).to.equal("Customer profile deleted successfully");
  });
});

describe('Admin /orders route implemented', () => {
  
  it('should get all orders successfully', async () => {
    const res = await agent.get('/admin/orders');
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
  });
});

describe('Admin /new-admin route implemented', () => {
  
  it('should through an error if trying to change the main Admin', async () => {
    const res = await agent.put('/admin/new-admin').send({ email: process.env.ADMIN_EMAIL, isAdmin: false });
    expect(res).to.have.status(403);
    expect(res.body.error).to.equal("Cannot change the status of the main Admin");
  });

  it('should make a new admin', async () => {
    const res = await agent.put('/admin/new-admin').send({ email: "customer5@customer.com", isAdmin: true });
    expect(res).to.have.status(200);
    expect(res.body.isAdmin).to.equal(true);
  });
});


describe('Admin /profile route implemented', () => {
  
  it('should get admin profile successfully', async () => {
    const res = await agent.get('/admin/profile');
    expect(res).to.have.status(200);
    expect(res.body.name).to.equal("Admin1");
  });

  it('should change admin email successfully', async () => {
    const res = await agent.put('/admin/profile').send({ email: "admin1234@example.com" });
    expect(res).to.have.status(200);
    expect(res.body.email).to.equal("admin1234@example.com");
  });

  it('should delete a single admin successfully', async () => {
    const res = await agent.delete('/admin/profile');
    expect(res).to.have.status(200);
    expect(res.body.message).to.equal("Profile deleted successfully");
  });

  it('should through an error if trying to change the main Admin', async () => {
    const res1 = await agent.get('/user/signout');
    const mainAdmin = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASS
    };
    const res2 = await agent.post('/user/signin').send(mainAdmin);
    const res = await agent.put('/admin/profile').send({ email: "admin1234@example.com" });
    expect(res).to.have.status(403);
    expect(res.body.error).to.equal("Cannot change the main Admin");
  });

  it('should through an error if trying to delete the main Admin', async () => {
    const res = await agent.delete('/admin/profile');
    expect(res).to.have.status(403);
    expect(res.body.error).to.equal("Cannot delete the main Admin");
  });
});