const express = require('express');
const User = require('../models/user');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

async function seed() {
    const usersCount = await User.countDocuments();
    if (usersCount > 0) {
        return;
    }
    for (let i = 0; i < 30; i++) {
        const newUser = new User({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            password: "password",
        });
        await newUser.save();
    }
}



seed().then(() => {
    console.log('Users seeded successfully');
}).catch((error) => {
    console.log(error);
    process.exit();
});