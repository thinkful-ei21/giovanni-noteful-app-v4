'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe.skip('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  
  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {
        const testUser = { username, password, fullname };

        let res;
        return chai
          .request(app)
          .post('/api/users')
          .send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.fullname).to.equal(testUser.fullname);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });
      it('Should reject users with missing username', function () {
        const testUser = { password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"Missing username in request body"}');
          });
      });

      /**
       * COMPLETE ALL THE FOLLOWING TESTS
       */
      it('Should reject users with missing password', function () {
        const testUser = { username, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"Missing password in request body"}');
          });
      });

      it('Should reject users with non-string username', function () {
        const testUser = { username: 875 ,password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"username should be a string"}');
          });
      });

      it('Should reject users with non-string password', function () {
        const testUser = { username,password: 134, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"password should be a string"}');
          });
      });

      it('Should reject users with non-trimmed username', function () {
        const testUser = { username :'  asd' , password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"username should not have trailing or leading spaces"}');
          });
      });

      it('Should reject users with non-trimmed password', function () {
        const testUser = { username , password:'  asd', fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"password should not have trailing or leading spaces"}');
          });
      });

      it('Should reject users with empty username', function () {
        const testUser = { username :'' , password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"name must be at least 1 character long"}');
          });
      });

      it('Should reject users with password less than 8 characters', function () {
        const testUser = { username , password:'asd', fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"password must be a minimum of 8 and max of 72 characters"}');
          });
      });

      it('Should reject users with password greater than 72 characters', function () {
        const testUser = { username,
          password:'aasasdasdasdasdasdasdasddasasdasdasdasdasdasdasddasasdasdasdasdasdasdasddasasdasdasdasdasdasdasddasasdasdasdasdasdasdasddasasdasdasdasdasdasdasddsasdasdasdasdasdasdasdd',
          fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":422,"message":"password must be a minimum of 8 and max of 72 characters"}');
          });
      });

      it('Should reject users with duplicate username', function () {
        const testUser = { username , password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .then(()=>{
            return chai.request(app).post('/api/users').send(testUser)})
          .then(res => {
            expect(res).to.have.status(400);
            expect(res).to.not.have.key('id');
            expect(res.text).to.equal('{"status":400,"message":"The username already exists"}');
          });
      });

      //it('Should trim fullname');
    });

    describe('GET', function () {
      it('Should return an empty array initially', function () {
        return chai.request(app).get('/api/users')
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body).to.have.length(0);
          });
      });
      it('Should return an array of users', function () {
        const testUser0 = {
          username: `${username}`,
          password: `${password}`,
          fullname: ` ${fullname} `
        };
        const testUser1 = {
          username: `${username}1`,
          password: `${password}1`,
          fullname: `${fullname}1`
        };
        const testUser2 = {
          username: `${username}2`,
          password: `${password}2`,
          fullname: `${fullname}2`
        };

        
        return Promise.all([
          User.create(testUser0),
          User.create(testUser1),
          User.create(testUser2)
        ])

          .then(() => {
            return chai.request(app).get('/api/users');
          })
          .then((res) =>{
            
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(3);
          });
        
      });
    });
  });
});