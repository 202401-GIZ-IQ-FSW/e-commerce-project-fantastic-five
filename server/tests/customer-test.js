const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const app = require('../index');
const User = require('../models/user');
const Item = require('../models/shop-item');

chai.use(chaiHttp);

const agent = chai.request.agent(app);

const adminUser = {
  email: "admin2@example.com",
  password: "Admin2$1234"
};

const customer = {
  email: "customer6@customer.com",
  password: "Customer$6"
};

let itemId;

const shopItem = {
  title: "Eco-Friendly Bamboo Toothbrush",
  image: "https://example.com/images/bamboo_toothbrush.jpg",
  price: 3.99,
  description: "A sustainable toothbrush made from natural bamboo.",
  availableCount: 150,
  genreOrCategory: "Health"
};

before(async () => {
  // Create a non-admin user
  await User.create({
      name: "Customer-6",
      email: "customer6@customer.com",
      password: "Customer$6"
  });

 await User.create({
    name: "Admin2",
    email: "admin2@example.com",
    password: "Admin2$1234",
    isAdmin: true
  });

  const res1 = await agent.post('/user/signin').send(adminUser);
  // console.log("customer route admin test signIn:", await res1.body.message);

  const res = await agent.post('/admin/items').send(shopItem);
  itemId = res.body._id;

  const res2 = await agent.get('/user/signout');
  // console.log("customer route admin test signOut:", await res2.body.message)

  const res3 = await agent.post('/user/signin').send(customer);
  // console.log("customer route user test signIn:", await res3.body.message);
});

after(async () => {
  const res = await agent.get('/user/signout');
  // console.log("customer route user test signOut:", await res.body.message)
  // Clean up the database after tests
  await User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL } });
  await Item.deleteMany({});
});

describe('Customer /items route implemented', () => {

  it('should get all items successfully', async () => {
    const res = await agent.get('/customer/items');
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
    expect(res.body[0].title).to.equal(shopItem.title);
  });

  it('should through an error if item is not found', async () => {
    const res = await agent.get('/customer/items/664e0f0139dd9c6b36f4811b');
    expect(res).to.have.status(404);
    expect(res.body.error).to.equal("Item not found");
  });

  it('should get a single item successfully', async () => {
    const res = await agent.get(`/customer/items/${itemId}`);
    expect(res).to.have.status(200);
    expect(res.body.title).to.equal(shopItem.title);
  });
});

describe('Customer /cart route implemented', () => {

  it('should through an error if item is not found', async () => {
    const res = await agent.post('/customer/cart').send({ itemId: "664e0f0139dd9c6b36f4811b", quantity: 10 });
    expect(res).to.have.status(404);
    expect(res.body.message).to.equal("Item not found");
  });

  it('should through an error if quantity is zero or below', async () => {
    const res = await agent.post('/customer/cart').send({ itemId: itemId, quantity: 0 });
    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("Please provide a valid quantity above Zero");
  });
  
  it('should through an error if quantity more than item availableCount', async () => {
    const res = await agent.post('/customer/cart').send({ itemId: itemId, quantity: 151 });
    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("Insufficient quantity");
  });

  it('should through an error if item is not in cart', async () => {
    const res = await agent.put('/customer/cart?addToCart=add').send({ itemId: itemId, quantity: 10 });
    expect(res).to.have.status(404);
    expect(res.body.error).to.equal("Item not in cart");
  });

  it('should add item to cart successfully', async () => {
    const res = await agent.post('/customer/cart').send({ itemId: itemId, quantity: 10 });
    expect(res).to.have.status(200);
    expect(res.body.message).to.equal("Item added to cart");
  });

  it('should through an error when adding the same item to cart', async () => {
    const res = await agent.post('/customer/cart').send({ itemId: itemId, quantity: 10 });
    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("Item already in cart");
  });

  it('should get cart successfully', async () => {
    const res = await agent.get('/customer/cart');
    expect(res).to.have.status(200);
    expect(res.body.cart).to.be.an("array");
    expect(res.body.cart[0].itemName).to.equal(shopItem.title);
  });

  it('should through an error if there is no cart params when adding or removing from cart', async () => {
    const res = await agent.put('/customer/cart').send({ itemId: itemId, quantity: 10 });
    expect(res).to.have.status(400);
    expect(res.body.error).to.equal("Please provide cart params either addToCart=add or removeFromCart=remove");
  });

  it('should through an error if increase quantity is more than item availableCount', async () => {
    const res = await agent.put('/customer/cart?addToCart=add').send({ itemId: itemId, quantity: 141 });
    expect(res).to.have.status(400);
    expect(res.body.error).to.equal("Insufficient quantity");
  });

  it('should through an error if decrease quantity is equal or less than item in cart quantity', async () => {
    const res = await agent.put('/customer/cart?removeFromCart=remove').send({ itemId: itemId, quantity: 10 });
    expect(res).to.have.status(400);
    expect(res.body.error).to.equal(`Wrong amount: only 10 available in cart and must have a default value of 1 in cart`);
  });

  it('should increase in cart item quantity successfully', async () => {
    const res = await agent.put('/customer/cart?addToCart=add').send({ itemId: itemId, quantity: 10 });
    expect(res).to.have.status(200);
    expect(res.body.message).to.equal("Item in cart quantity added successfully");
  });

  it('should decrease in cart item quantity successfully', async () => {
    const res = await agent.put('/customer/cart?removeFromCart=remove').send({ itemId: itemId, quantity: 10 });
    expect(res).to.have.status(200);
    expect(res.body.message).to.equal("Item in cart quantity removed successfully");
  });

  it('should delete cart successfully', async () => {
    const res = await agent.delete(`/customer/cart`).send({itemId: itemId});
    expect(res).to.have.status(200);
    expect(res.body.message).to.equal("Item removed from cart");
  });
});

describe('Customer /checkout and /orders implemented', () => {

  it('should through an error if cart is empty', async () => {
    const res = await agent.post('/customer/checkout')
                           .send({ ShippingAddress: { address: "Downtown", city: "Dubai" }});
    expect(res).to.have.status(400);
    expect(res.body.message).to.equal("Cart is empty");
  });

  it('should checkout successfully', async () => {
    const res1 = await agent.post('/customer/cart').send({ itemId: itemId, quantity: 8 });
    expect(res1).to.have.status(200);
    expect(res1.body.message).to.equal("Item added to cart");

    const res = await agent.post('/customer/checkout')
                           .send({ ShippingAddress: { address: "Downtown", city: "Dubai" }});
    expect(res).to.have.status(200);
    expect(res.body.message).to.equal("Order placed successfully");
    expect(res.body.order.items).to.be.an("array");
    expect(res.body.order.items[0].title).to.equal(shopItem.title);
  });

  it('should get orders successfully', async () => {
    const res = await agent.get('/customer/orders');
    expect(res).to.have.status(200);
    expect(res.body.orders).to.be.an("array");
    expect(res.body.orders[0].items[0].itemId.title).to.equal(shopItem.title);
  });
});

describe('Customer /profile route implemented', () => {
  
  it('should get customer profile successfully', async () => {
    const res = await agent.get('/customer/profile');
    expect(res).to.have.status(200);
    expect(res.body.user.name).to.equal("Customer-6");
  });

  it('should change customer email successfully', async () => {
    const res = await agent.put('/customer/profile').send({ email: "customer7@customer.com" });
    expect(res).to.have.status(200);
    expect(res.body.user.email).to.equal("customer7@customer.com");
  });

  it('should through an error if trying to change the main Admin', async () => {
    const res1 = await agent.get('/user/signout');
    const mainAdmin = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASS
    };
    const res2 = await agent.post('/user/signin').send(mainAdmin);
    const res = await agent.put('/customer/profile').send({ email: "admin1234@example.com" });
    expect(res).to.have.status(403);
    expect(res.body.error).to.equal("Cannot change the main Admin");
  });
});