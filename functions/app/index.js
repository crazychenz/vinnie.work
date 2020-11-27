const functions = require('firebase-functions');
//import functions from "firebase-functions";
import admin from 'firebase-admin';

import { createPostCommentEndPoint, createPostCommentCallable } from './createPostComment';

admin.initializeApp();

// Rest End Points
exports.createPostCommentEndPoint = functions.https.onRequest(createPostCommentEndPoint);

// HTTP Call-ables
exports.createPostCommentCallable = functions.https.onCall(createPostCommentCallable);
