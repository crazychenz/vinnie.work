import express from 'express';
import admin, { database } from 'firebase-admin';
import bodyParser from 'body-parser';
import Sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import Hex from 'crypto-js/enc-hex';
import HmacSha256 from 'crypto-js/hmac-sha256';

async function createPostComment(body) {
  console.log('Creating post comment.');

  if (body.captcha !== 'human') {
    return { error: 'Failed captcha.' };
  }

  const recv_date = Date.now();

  // TODO: Return error if username and password don't meet
  // TODO: constraints. (username must be 2 characters,
  // TODO: password must be 5 characters.)

  const key = `${body.username}${body.password}`;
  const dynUserId = Base64.stringify(Sha256(key));
  const signature = Hex.stringify(HmacSha256(body.comment, dynUserId));

  // TODO: The emulator is being weird when we have sub-collections
  // TODO: without any associated fields. Need to write the reader code
  // TODO: to actually verify if the API is working correctly. :(
  try {
    //! This is required to be run once per post to inspect the
    //! documents with the web based UI interface. I do not know
    //! how to perform this unless we somehow call an API from
    //! netlify, or potentially depend on a read from a client
    //! indicating there was nothing to read, forcing us to
    //! create this entry.
    // TODO: For now I'm going to leave this here. Could be
    // TODO: expensive later since this is an additional write
    // TODO: for each comment post.
    const preWriteResult = await admin
      .firestore()
      .collection('blog_comments')
      .doc(body.slug)
      .set({ dummy: '' });

    const entry = {
      date: recv_date,
      version: '1.0',
      username: body.username,
      dynUserId,
      signature,
      comment: body.comment,
      counts: {
        redFlags: 0,
        stars: 0,
      },
    };

    const writeResult = await admin
      .firestore()
      .collection('blog_comments')
      .doc(body.slug)
      .collection('comments')
      .doc(`${recv_date}-${signature}`)
      .set(entry);

    return {
      message: `You made it. ${JSON.stringify(writeResult)} `,
      date: Date.now(),
      sent: body,
      entry: entry,
    };
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
