const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Import your model
const Country = require('../models/Admin/Country');
const State = require('../models/Admin/State');
const City = require('../models/Admin/City');


// 3. Path to your JSON file
const DATA_PATH = path.join(__dirname, 'countries.json');
const STATE_DATA_PATH = path.join(__dirname, 'states.json');
const CITY_DATA_PATH = path.join(__dirname, 'cities.json');

async function seedCountries() {
  await mongoose.connect(process.env.MONGO_URI);

  // Check if collection is empty or contains only null documents
  const count = await Country.countDocuments({});

  if (count === 0) {
    let data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    data = data.map(item => {
      item._id = item.id;
      delete item.id;
      return item;
    });
    await Country.insertMany(data);
    console.log('Countries seeded!');
  } else {
    console.log('Countries collection is not empty. Skipping seeding.');
  }


  // Check if collection is empty or contains only null documents
  const statecount = await State.countDocuments({});

  if (statecount === 0) {
    let data = JSON.parse(fs.readFileSync(STATE_DATA_PATH, 'utf-8'));
    data = data.map(item => {
      item._id = item.id;
      delete item.id;
      return item;
    });
    console.log({data})
    await State.insertMany(data);
    console.log('State seeded!');
  } else {
    console.log('State collection is not empty. Skipping seeding.');
  }


  // Check if collection is empty or contains only null documents
  const citycount = await City.countDocuments({});

  if (citycount === 0) {
    let data = JSON.parse(fs.readFileSync(CITY_DATA_PATH, 'utf-8'));
    data = data.map(item => {
      item._id = item.id;
      delete item.id;
      return item;
    });
    await City.insertMany(data);
    console.log('City seeded!');
  } else {
    console.log('City collection is not empty. Skipping seeding.');
  }

//   await mongoose.disconnect();
}

module.exports = seedCountries;
