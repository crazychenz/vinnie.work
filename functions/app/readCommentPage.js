import express from 'express';
import admin, { database } from 'firebase-admin';
import bodyParser from 'body-parser';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

async function readCommentPage(body) {
  console.log('Fetching comment page.');

  try {
    const allCommentsSnapshot = await admin
      .firestore()
      .collection('blog_comments')
      .doc(body.slug)
      .collection('comments')
      .get();

    let comments = [];

    allCommentsSnapshot.forEach((doc) => {
      comments.push(doc.data());
    });

    return {
      message: `You made it. Comments returned.`,
      comments: comments,
      date: Date.now(),
      sent: body,
    };
  } catch (error) {
    return { message: `Read comments error: ${error.message}` };
  }
}

const readCommentPageEndPoint = express();
readCommentPageEndPoint.use(bodyParser.json());
readCommentPageEndPoint.use(async (req, res) => {
  res.send(await readCommentPage(req.body));
});

async function readCommentPageCallable(data, context) {
  return await readCommentPage(data);
}

export { readCommentPage, readCommentPageEndPoint, readCommentPageCallable };
