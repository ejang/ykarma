import { auth } from './firebase';

// Action code settings
var devActionCodeSettings = {
  url: 'http://localhost:3000/finishSignIn',
  handleCodeInApp: true,
};

const prodActionCodeSettings = devActionCodeSettings;

const actionCodeSettings = process.env.NODE_ENV === 'production' ? prodActionCodeSettings : devActionCodeSettings;

// Send sign in link
export const sendSignInLinkToEmail = (email) => {
  auth.sendSignInLinkToEmail(email, actionCodeSettings)
  .then(function() {
    window.localStorage.setItem('emailForSignIn', email);
  })
  .catch(function(error) {
    console.log("Firebase sign-in link error", error);
  });
};

// Sign in
export const signInViaEmailLink = async (href) => {
  if (auth.isSignInWithEmailLink(href)) {
    var email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }
    auth.signInWithEmailLink(email, href)
      .then(function(result) {
        window.localStorage.removeItem('emailForSignIn');
        console.log("Logged in as user", result.user);
        console.log("Additional info", result.additionalUserInfo);
      })
      .catch(function(error) {
        console.log("Firebase sign-in error", error);
      });
  }
};

// Sign out
export const doSignOut = () =>
  auth.signOut();

// Current user

const setToken = (idToken) => {
  const authProvider = localStorage.getItem("authProvider");
  var handle = null;
  if (authProvider === "twitter") {
    const additionalInfo = JSON.parse(localStorage.getItem("additionalUserInfo") || "{}")
    handle = "@" + additionalInfo.username;
  }
  fetch('/accounts/token/set', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', },
    body: JSON.stringify({ token: idToken, handle: handle })
  }).then(result => {
    if (result.ok) {
      result.json().then((json) => {
        console.log("token result",json);
        sessionStorage.setItem("tokenPosted", json.success);
      })
    } else {
      console.log("token failure", idToken);
    }
  }).catch(error => {
    console.log("token error for", error);
    console.log("token error token", idToken);
  });
}

var currentUser;

auth.onAuthStateChanged(function (user) {
  if (user) {
    // console.log("user", user);
    console.log("Setting token");
    var forceRefresh = sessionStorage.getItem("currentToken") == null;
    if ( (new Date()).getTime() - (sessionStorage.getItem("currentTokenSet") || 0) > 300000) {
      forceRefresh = true;
    }
    user.getIdToken(true).then(function(idToken) {
      if (sessionStorage.getItem("currentToken") !== idToken) {
        setToken(idToken);
        sessionStorage.setItem("currentToken", idToken);
        sessionStorage.setItem("currentTokenSet", (new Date()).getTime());
      }
    }).catch(error => {
      console.log("setToken error", error);
    })
  } else {
    console.log("Signing out");
    setToken(null);
    sessionStorage.clear();
    localStorage.clear();
  }
  currentUser = user;
});

export const getUser = () => {
  return currentUser;
}

export const tokenPosted = () => {
  return sessionStorage.getItem("tokenPosted");
}

// TODO: linking credentials at the Firebase level per https://firebase.google.com/docs/auth/web/email-link-auth etc.
