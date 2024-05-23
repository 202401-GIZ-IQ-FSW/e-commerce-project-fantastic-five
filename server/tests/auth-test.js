const request = require("supertest");
const chai = require('chai');
const { expect } = chai;
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const app = require("../index");
const User = require('../models/user');

chai.use(chaiHttp);

after(async () => {
    // Clean up the database after tests
    await User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL } });
  });

describe('SignUp tasks implemented', () => {
    
    it('through an error if name is not provided', (done) => {
        const newUser = {
            name: "",
            email: "customer1@customer.com",
            password:"Customer$1"
        };
        request(app)
            .post('/user/signup')
            .set("Content-Type", "application/json")
            .send(newUser)
            .expect("Content-Type", /json/)
            .expect(500, (err, res) => {
                if (err) return done(err);
                expect(res.body.error).to.equal('User validation failed: name: Path `name` is required.');
                done();
            });
    });

    it('should through an error if email is not a valid format', (done) => {
        const newUser = {
            name: "Customer-1",
            email: "customer1customer.com",
            password:"Customer$1"
        };
        request(app)
            .post('/user/signup')
            .set("Content-Type", "application/json")
            .send(newUser)
            .expect("Content-Type", /json/)
            .expect(500, (err, res) => {
                if (err) return done(err);
                expect(res.body.error).to.equal('User validation failed: email: Please provide a valid email address');
                done();
            });
    });

    it('should through an error if password does not meet the minimum requirements', (done) => {
        const newUser = {
            name: "Customer-1",
            email: "customer1@customer.com",
            password:"customer1"
        };
        request(app)
            .post('/user/signup')
            .set("Content-Type", "application/json")
            .send(newUser)
            .expect("Content-Type", /json/)
            .expect(500, (err, res) => {
                if (err) return done(err);
                expect(res.body.error).to.equal('Password must contain at least 8 characters, including uppercase, lowercase, number, and special character');
                done();
            });
    });

    it('should register a new user successfully', (done) => {
        const newUser = {
            name: "Customer-1",
            email: "customer1@customer.com",
            password:"Customer$1"
        };
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
                done();
            });
    });

    it('checks if email is already used ', (done) => {
        const newUser = {
            name: "Customer-1",
            email: "customer1@customer.com",
            password:"Customer$1"
        };
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

describe('SignOut task implemented', () => {

    it('should sign out successfully', async () => {
        const correctUser = {
            email: "customer1@customer.com",
            password: "Customer$1"
        };
        
        const agent = chai.request.agent(app);
        const res1 = await agent.post('/user/signin').send(correctUser);
        expect(res1.body.message).to.equal("SignIn Success");
        
        const res2 = await agent.get('/user/signout');
        expect(res2).to.have.status(200);
        expect(res2.body.message).to.equal('SignOut Success');
    });
});

describe('SignIn tasks implemented', () => {
    
    it('should through an error if email is not correct', (done) => {
        const incorrectEmail = {
            email: 'custmer1@customer.com',
            password: 'Customer$1',
        };
        request(app)
            .post('/user/signin')
            .set("Content-Type", "application/json")
            .send(incorrectEmail)
            .expect("Content-Type", /json/)
            .expect(400, (err, res) => {
                if (err) return done(err);
                expect(res.body.message).to.equal('Wrong email');
                done();
            });
    });

    it('should through an error if password is not correct', (done) => {
        const incorrectPassword = {
            email: 'customer1@customer.com',
            password: 'customer',
        };
        request(app)
            .post('/user/signin')
            .set("Content-Type", "application/json")
            .send(incorrectPassword)
            .expect("Content-Type", /json/)
            .expect(400, (err, res) => {
                if (err) return done(err);
                expect(res.body.message).to.equal('Wrong password');
                done();
            });
    });

    it('should sign in a user successfully', (done) => {
        const correctUser = {
            email: "customer1@customer.com",
            password: "Customer$1"
        };
        request(app)
            .post('/user/signin')
            .set("Content-Type", "application/json")
            .send(correctUser)
            .expect("Content-Type", /json/)
            .expect(200, (err, res) => {
                if (err) return done(err);
                expect(res.body.message).to.equal("SignIn Success");
                expect(res.body.user.name).to.equal("Customer-1");
                expect(res.body.user.email).to.equal(correctUser.email);
                done();
            });
    });
});

describe('Second SignIn request', () => {

    it('Checks if user is already signed in', async () => {
        const correctUser = {
            email: "customer1@customer.com",
            password: "Customer$1"
        };
        
        const agent = chai.request.agent(app);
        const res1 = await agent.post('/user/signin').send(correctUser);
        expect(res1.body.message).to.equal("SignIn Success");
        
        const res2 = await agent.post('/user/signin').send(correctUser);
        expect(res2).to.have.status(400);
        expect(res2.body.message).to.equal('User already signed in');

        const res3 = await agent.get('/user/signout');
        expect(res3).to.have.status(200);
        expect(res3.body.message).to.equal('SignOut Success');
    });
});