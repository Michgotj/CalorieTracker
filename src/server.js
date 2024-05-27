const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://caloriestracking-8f63e-default-rtdb.firebaseio.com/' 
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());

app.post('/api/dailysummary', async (req, res) => {
  const dailySummaryData = req.body;
  try {
    const docRef = await db.collection('dailysummaries').add(dailySummaryData);
    console.log('Document written with ID:', docRef.id);
    res.status(201).send('Daily summary data saved successfully.');
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).send('Error saving daily summary data.');
  }
});

app.get('/api/dailysummary', async (req, res) => {
  try {
    const snapshot = await db.collection('dailysummaries').get();
    if (snapshot.empty) {
      return res.status(404).send('No daily summaries found.');
    }
    
    const summaryData = snapshot.docs.map(doc => doc.data());
    res.status(200).json(summaryData);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).send('Error fetching daily summary data.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
