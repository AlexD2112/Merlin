const fs = require('fs');

// Data Stored
let data = {};

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
    console.log(`We have loaded: ${loadName} data:`, data);
  } catch (error) {
    console.error(`Error loading data for ${loadName}:`, error);
  }
}

// Update Function - update(name, updatedata, newvalue)
function update(fileName, updateData, newValue) {
  load(fileName); // Loads past value
  data[updateData] = newValue; // Changes the value/adds a new variable
  save(fileName, data); // Saves the changes
}

function varDelete(fileName, deleteName) {
  load(fileName);
  delete data[deleteName];
  save(fileName, data);
}

module.exports = {update, varDelete};
