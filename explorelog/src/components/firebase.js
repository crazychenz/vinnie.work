import firebase from "firebase/app";
import "firebase/auth";
import "firebase/functions";
import "firebase/storage";

// var firebaseConfig = {
//   apiKey: "AIzaSyBK496vRixZjkozxhSZPMpePfPvTfS6Ftc",
//   authDomain: "vinnie-work.firebaseapp.com",
//   databaseURL: "https://vinnie-work.firebaseio.com",
//   projectId: "vinnie-work",
//   storageBucket: "vinnie-work.appspot.com",
//   messagingSenderId: "1046523210545",
//   appId: "1:1046523210545:web:e812141d94f0bf65911e10",
//   measurementId: "G-2P5WQTD9Q6",
// };
// // Initialize Firebase
// const server = firebase.initializeApp(firebaseConfig);
// //server.functions().useFunctionsEmulator("http://192.168.1.184:6001")
// server.functions().useEmulator("192.168.73.130", 6001);
// //server.auth().useEmulator("http://10.0.0.85:6099/")
// // server.firestore().useEmulator("10.0.0.85", 6080)

// const createPostComment = server
//   .functions()
//   .httpsCallable("createPostCommentCallable");

// const readCommentPage = server
//   .functions()
//   .httpsCallable("readCommentPageCallable");

// Adding dummy exports for netlify while comments disabled.
const server = {};
function createPostComment() {}
function readCommentPage() {}

export { server, createPostComment, readCommentPage };
