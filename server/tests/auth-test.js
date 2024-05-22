const request = require("supertest");
const expect = require("chai").expect;
const app = require("../index");
const bcrypt = require('bcrypt');
const User = require('../models/user');

const newUser = {
    name: "Customer-1",
    email: "customer1@customer.com",
    password:"customer1"
};

const correctCostumer = {
    email: 'customer1@customer.com',
    password: 'customer1',
};
  
const incorrectEmail = {
    email: 'custmer1@customer.com',
    password: 'customer1',
};
  
const incorrectPassword = {
    email: 'custmer1@customer.com',
    password: 'customer',
};

describe('Signup tasks implemented', () => {
    after(async () => {
        // Clean up the database after tests
        await User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL } });
      });

    it('registers a new user successfully', (done) => {
        request(app)
            .post('/user/signup')
            .set("Content-Type", "application/json")
            .send(newUser)
            .expect("Content-Type", /json/)
            .expect(201, (err, res) => {
                if (err) return done(err);
                expect(res.body.message).to.equal("SignUp Success");
                expect(res.body.user.name).to.equal(newUser.name);
                expect(res.body.user.email).to.equal(newUser.email);
                // expect(bcrypt.compare(res.body.user.password, newUser.password)).to.equal(true);
                done();
            });
    });

    it('checks if email is already used ', (done) => {
        request(app)
            .post('/user/signup')
            .set("Content-Type", "application/json")
            .send(newUser)
            .expect("Content-Type", /json/)
            .expect(400, (err, res) => {
                if (err) return done(err);
                expect(res.body.message).to.equal(`${newUser.email}: email already exist`);
                done();
            });
    });

});