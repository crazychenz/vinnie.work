const functions = require('firebase-functions');
//import functions from "firebase-functions";
import admin from 'firebase-admin';

import { createPostCommentEndPoint, createPostCommentCallable } from './createPostComment';
import { readCommentPageEndPoint, readCommentPageCallable } from './readCommentPage';

admin.initializeApp();

// Rest End Points
exports.createPostCommentEndPoint = functions.https.onRequest(createPostCommentEndPoint);
exports.readCommentPageEndPoint = functions.https.onRequest(readCommentPageEndPoint);

// HTTP Call-ables
exports.createPostCommentCallable = functions.https.onCall(createPostCommentCallable);
exports.readCommentPageCallable = functions.https.onCall(readCommentPageCallable);
