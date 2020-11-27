import express from 'express';
import admin, { database } from 'firebase-admin';
import bodyParser from 'body-parser';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

async function createPostComment(body) {
  console.log('Creating post comment.');

  if (body.captcha != 'human') {
    return { error: 'Failed captcha.' };
  }

  const recv_date = Date.now();

  // TODO: Hmac?
  const token = Base64.stringify(sha256(`${body.username}${body.password}`));

  // TODO: The emulator is being weird when we have sub-collections
  // TODO: without any associated fields. Need to write the reader code
  // TODO: to actually verify if the API is working correctly. :(
  try {
    const writeResult = await admin
      .firestore()
      .collection('blog_comments')
      .doc(body.slug)
      .collection('comments')
      .doc(`${recv_date}-${token}`)
      .set({ username: body.username, comment: body.comment }, { merge: true });

    return {
      message: `You made it. ${JSON.stringify(writeResult)} `,
      date: Date.now(),
      sent: body,
      token: token,
    };

    //return { message: `Received metadata update: ${writeResult}` };
  } catch (error) {
    return { message: `Create post comment error: ${error.message}` };
  }
}

const createPostCommentEndPoint = express();
createPostCommentEndPoint.use(bodyParser.json());
createPostCommentEndPoint.use(async (req, res) => {
  res.send(await createPostComment(req.body));
});

async function createPostCommentCallable(data, context) {
  return await createPostComment(data);
}

export { createPostComment, createPostCommentEndPoint, createPostCommentCallable };
