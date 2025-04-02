require('dotenv').config();
const { faker } = require('@faker-js/faker');
const { randomInt } = require('crypto');
const mongoose = require('mongoose');
const { ACCOUNT_NUMBER_LENGTH, ACCOUNT_NUMBER_PREFIXES } = require('../../validations/rules/database/accountRules');
const User = require('./models/User');
const Account = require('./models/Account');
const Admin = require('./models/Admin');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
      readline.question(question, answer => {
        readline.close();
        resolve(answer.toLowerCase());
      });
    });
}


function generateAccountNumber() {
    const prefix = ACCOUNT_NUMBER_PREFIXES[randomInt(0, ACCOUNT_NUMBER_PREFIXES.length)];
    let num = '';
    while (num.length < ACCOUNT_NUMBER_LENGTH - prefix.length) {
        num += randomInt(0, 10);
    }
    return prefix + num;
}

// Factories
const adminFactory = () => {
    return { 
        _id: new mongoose.Types.ObjectId(faker.database.mongodbObjectId()),
        employeeId: String(faker.number.int({ min: 1000000000000001, max: 9999999999999999 })),
        password: 'admin123456789##',
        email: faker.internet.email({ provider: 'test.com' }),
        role: 'admin',
        security: { status: 'pending' }
    }
}

const userFactory = () => {
    return { 
        _id: new mongoose.Types.ObjectId(faker.database.mongodbObjectId()),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email({ provider: 'test.com' }),
        password: 'user123456789##',
        nationalId: String(faker.number.int({ min: 10000000000001, max: 99999999999999 })),
        gender: 'male',
        address: faker.location.streetAddress(),
        phoneNumber: `+20115000${faker.number.int({ min: 1000, max: 9999 })}`,
        dateOfBirth: faker.date.birthdate({ mode: 'age', min: 21, max: 60 }).toISOString().split('T')[0],
    }
}

const accountFactory = (holderId) => {
    return {
        _id: new mongoose.Types.ObjectId(faker.database.mongodbObjectId()),
        accountNumber: generateAccountNumber(),
        accountHolderId: holderId,
        accountType: "Savings",
        balance: 30000,
        status: "Active",
    }
}

const dummyData = (async () => {
    console.log('Welcome to bank system setup, starting to create dummy data...');
    console.log(`ENV: '${process.env.NODE_ENV}'`);
    const count = { admins: 5, users: 10 };
    let admins = [];
    let users = [];
    let accounts = [];
    
    admins.push({
        _id: new mongoose.Types.ObjectId(faker.database.mongodbObjectId()),
        employeeId: '1000000000000000',
        email: 'system@test.com',
        password: '$uper1234567890',
        role: 'superadmin',
        security: { status: 'active' }
    }) // inserting the default superadmin

    for (let i=0; i < count.admins ;i++) {
        admins.push(adminFactory());
    }

    let user;
    for (let i=0; i < count.users ;i++) {
        user = userFactory();
        users.push(user);
        accounts.push(accountFactory(user._id));
    }

    if (admins.length !== count.admins+1 || users.length !== count.admins, users.length !== count.accounts) {
        try {
            await mongoose.connect(String(process.env.MONGO_URI));
            console.log('[+] DB Connected!');
            
            const clearDB = await ask('[?] Do you want to delete all old DB data ? (y/N) ');
            if (clearDB.toLowerCase() === 'y') {
                console.log('[+] Deleting the old DB data...');
                const deleteAdmins = await Admin.deleteMany();
                const deleteUsers = await User.deleteMany();
                const deleteAccounts = await Account.deleteMany();
                if (!deleteAdmins || !deleteUsers || !deleteAccounts){
                    console.log('[-] Couldn\'t delete the DB, An error occurred while deleting!');
                } else {
                    console.log('[+] Successfully deleted all data in DB.')
                }
            }

            const createAdmins = await Admin.create(admins);
            if (!createAdmins) {
                console.log('[-] Failed to create admins.');
                process.exit(1);
            }

            const createUsers = await User.create(users);
            if (!createUsers) {
                console.log('[-] Failed to create users.');
                process.exit(1);
            }

            const createAccounts = await Account.create(accounts);
            if (!createAccounts) {
                console.log('[-] Failed to create accounts.');
                process.exit(1);
            }
        } catch (error) {
            console.log('[-] Error: ', error);
            process.exit(1);
        }

        console.log(`[+] Created: ${admins.length} admins, ${users.length} users that has ${accounts.length} accounts `);
        console.log('[+] All done.');
        process.exit(0);
    }
})();
