const fs = require('fs');

// User Name
const username = 'Mark';
// Name of the file
const name = 'Mark';

// Data Stored
let data = {};

let updateData = { 'Test data': 'TEST' };
let newVal = null;

// Save Function - save(UserName, DataToBeSaved)
function save(saveName, dataToBeSaved) {
  // Opens the file with the user's name to save data
  fs.writeFileSync(saveName, JSON.stringify(dataToBeSaved));
}

// Load Function - load(UserName)
function load(loadName) {
  // Opens the file with the user's name to load data
  try {
    data = JSON.parse(fs.readFileSync(loadName, 'utf8'));
    console.log(`We have loaded: ${name} data:`, data);
  } catch (error) {
    console.error(`Error loading data for ${name}:`, error);
  }
}

// Update Function - update(name, updatedata, newvalue)
function update(updateName, updateData, newValue) {
  load(updateName); // Loads past value
  data[updateData] = newValue; // Changes the value/adds a new variable
  save(name, data); // Saves the changes
}

function varDelete(deleteName) {
  load(name);
  delete data[deleteName];
  save(name, data);
}
