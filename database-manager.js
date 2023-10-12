const fs = require('fs');

let data = {}

// Save Function - save(UserName, DataToBeSaved)
function save(fileName, data) {
  try {
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error saving data to ${fileName}:`, error);
  }
}

// Load Function - load(UserName)
function load(fileName) {
  try {
    const rawData = fs.readFileSync(fileName, 'utf8');
    data = JSON.parse(rawData)
    return data;
  } catch (error) {
    console.error(`Error loading data from ${fileName}:`, error);
    return {};
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

module.exports = { update, varDelete, load, save};
