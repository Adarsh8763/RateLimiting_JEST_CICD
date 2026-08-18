import mongoose        from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from '../models/user.model.js';

let mongoServer;

export const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
};

export const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

beforeAll(async () => await connect());
afterAll(async  () => await disconnect());
afterEach(async () => await clearCollections())


describe('User Model Test', () => {
    it('create & save user successfully', async () => {
        const validUser = new userModel({ name: 'John Doe', email: 'john.doe@example.com', password: 'password123' });
        const savedUser = await validUser.save();
        const savedPassword = savedUser.password;
        expect(savedUser.name).toBe('John Doe');
        expect(savedUser.email).toBe('john.doe@example.com');
        expect(savedPassword).toBe('password123');
    });
    it('should fail to create user without required email field', async () => {
        const userWithoutEmail = new userModel({ name: 'Jane Doe', password: 'password123' });
        let err;
        try {
            await userWithoutEmail.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });
});