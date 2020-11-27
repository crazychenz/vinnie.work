import firebase from "firebase/app"
import "firebase/auth"
import "firebase/functions"
import "firebase/storage"

var firebaseConfig = {
  apiKey: "AIzaSyBK496vRixZjkozxhSZPMpePfPvTfS6Ftc",
  authDomain: "vinnie-work.firebaseapp.com",
  databaseURL: "https://vinnie-work.firebaseio.com",
  projectId: "vinnie-work",
  storageBucket: "vinnie-work.appspot.com",
  messagingSenderId: "1046523210545",
  appId: "1:1046523210545:web:e812141d94f0bf65911e10",
  measurementId: "G-2P5WQTD9Q6",
}
// Initialize Firebase
const server = firebase.initializeApp(firebaseConfig)
//server.functions().useFunctionsEmulator("http://192.168.1.184:6001")

const createPostComment = server
  .functions()
  .httpsCallable("createPostCommentCallable")

export { server, createPostComment }
