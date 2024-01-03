const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

admin.initializeApp();

exports.annotateImage = functions.https.onCall(async (data, context) => {
  // data should contain base64-encoded image

  const request = {
    image: {
      content: data.image,
    },
  };

  const [result] = await client.labelDetection(request);
  const labels = result.labelAnnotations;
  console.log('Labels:');
  labels.forEach(label => console.log(label.description));

  return {labels: labels.map(label => label.description)};
});
