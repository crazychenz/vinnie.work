import express from 'express';
import admin, { database } from 'firebase-admin';
import bodyParser from 'body-parser';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

// TODO: Rename this to readNextCommentPage and create another
// TODO: function called readPrevCommentPage. The former would
// TODO: use startAfter and the latter would use endAt. These
// TODO: should be sub functions of readCommentPage() function.

// slug, offset
async function readCommentPage(body) {
  try {
    const limit = 10;
    const commentsSnapshot = await admin
      .firestore()
      .collection('blog_comments')
      .doc(body.slug)
      .collection('comments')
      .limit(limit)
      .offset(body.offset)
      .get();

    let comments = [];
    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push(data);
    });

    return {
      message: `You made it. Comments returned.`,
      comments: comments,
      offset: body.offset,
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
