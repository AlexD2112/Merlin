const admin = require('firebase-admin');

// Replace 'path/to/serviceAccountKey.json' with the path to the JSON file you downloaded
const serviceAccount = require('./firebaseKey.json');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

let data = {}

// Save Function - save(UserName, DataToBeSaved)
async function saveCollection(collectionName, data) {
  const batch = db.batch();

  Object.keys(data).forEach(docId => {
    const docRef = db.collection(collectionName).doc(docId);
    batch.set(docRef, data[docId]);
  });

  return batch.commit()
    .then(() => console.log('Collection saved successfully'))
    .catch(error => console.error('Error saving collection:', error));
}

// Load Function - creates a map of doc names to doc data
async function loadCollection(collectionName) {
  try {
    const collection = await db.collection(collectionName).get();
    const data = {};
    collection.forEach(doc => data[doc.id] = doc.data());
    return data;
  } catch (error) {
    console.error('Error loading collection:', error);
    return {};
  }
}

async function saveFile(collectionName, docId, data) {
  return db.collection(collectionName).doc(docId).set(data)
    .then(() => console.log('Document saved successfully'))
    .catch(error => {
        console.error('Error saving document:', error);
        throw error; // Re-throw the error to ensure it can be caught by the calling function
    });
}

async function loadFile(collectionName, docId) {
  try {
    const doc = await db.collection(collectionName).doc(docId).get();
    if (doc.exists) {
      return doc.data();
    } else {
      console.log('No such document!');
      return undefined;
    }
  } catch (error) {
    console.error('Error loading document:', error);
    return {};
  }
}

async function docDelete(collectionName, docName) {
  return db.collection(collectionName).doc(docName).delete()
    .then(() => console.log('Document deleted'))
    .catch(error => {
        console.error('Error deleting document:', error);
        throw error; // Re-throw the error to ensure it can be caught by the calling function
    });
}

async function fieldDelete(collectionName, docName, deleteField) {
  return db.collection(collectionName).doc(docName).update({
    [deleteField]: admin.firestore.FieldValue.delete()
  })
    .then(() => console.log('Field deleted'))
    .catch(error => {
        console.error('Error deleting field:', error);
        throw error; // Re-throw the error to ensure it can be caught by the calling function
    });
}

async function logData() {
  try {
    const collections = await db.listCollections();
    let logData = {};
    for (const collection of collections) {
      if (collection.id === 'logs') {
        continue;
      }
      const snapshot = await collection.get();
      logData[collection.id] = {};
      snapshot.forEach(doc => {
        logData[collection.id][doc.id] = doc.data();
      });
    }
    const date = new Date();
    const dateString = date.toISOString().split('T')[0];

    await saveFile('logs', dateString, logData);
    console.log(`Log data for ${dateString} saved successfully in Firestore.`);
  } catch (error) {
    console.error('Error logging data:', error);
  }
}

module.exports = { saveCollection, loadCollection, saveFile, loadFile, docDelete, fieldDelete, logData };
