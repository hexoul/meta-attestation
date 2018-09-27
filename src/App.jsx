/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// React core.
import React from 'react';
import ReactDOM from 'react-dom';

// Firebase.
import firebase from 'firebase/app';
import 'firebase/auth';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

// Styles
import styles from './app.css'; // This uses CSS modules.
import './firebaseui-styling.global.css'; // Import globally.

// Web3
import Web3 from 'web3';

// Get the Firebase config from the auto generated file.
const firebaseConfig = require('./firebase-config.json').result;

// Instantiate a Firebase app.
const firebaseApp = firebase.initializeApp(firebaseConfig);

/**
 * The Splash Page containing the login UI.
 */
class App extends React.Component {
  uiConfig = {
    signInFlow: 'popup',
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.GithubAuthProvider.PROVIDER_ID,
      firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: () => false,
    },
  };

  state = {
    isSignedIn: undefined,
  };

  actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this URL
    // must be whitelisted in the Firebase Console.
    'url': window.location.href, // Here we redirect back to this same page.
    'handleCodeInApp': true // This must be true.
  };

  sendSignInLinkToEmail() {
    var email = document.getElementById('email');
    if (! email.value) {
      return;
    }

    firebase.auth().sendSignInLinkToEmail(email.value, this.actionCodeSettings)
      .then(function() {
        // The link was successfully sent. Inform the user.
        // Save the email locally so you don't need to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem('emailForSignIn', email.value);
      })
      .catch(function(error) {
        // Some error occurred, you can inspect the code: error.code
      });
  }

  isSignInWithEmailLink() {
    // Confirm the link is a sign-in with email link.
    if (! firebase.auth().isSignInWithEmailLink(window.location.href)) {
      return;
    }
    // Additional state parameters can also be passed via URL.
    // This can be used to continue the user's intended action before triggering
    // the sign-in operation.
    // Get the email if available. This should be available if the user completes
    // the flow on the same device where they started it.
    var email = window.localStorage.getItem('emailForSignIn');
    if (! email) {
      // User opened the link on a different device. To prevent session fixation
      // attacks, ask the user to provide the associated email again. For example:
      // email = window.prompt('Please provide your email for confirmation');
      return;
    }
    // The client SDK will parse the code from the link for you.
    firebase.auth().signInWithEmailLink(email, window.location.href)
      .then(function(result) {
        // Clear email from storage.
        window.localStorage.removeItem('emailForSignIn');
        // You can access the new user via result.user
        // Additional user info profile not available via:
        // result.additionalUserInfo.profile == null
        // You can check if the user is new or existing:
        // result.additionalUserInfo.isNewUser
        this.setState({isSignedIn: true});
      })
      .catch(function(error) {
        // Some error occurred, you can inspect the code: error.code
        // Common errors could be invalid email and invalid or expired OTPs.
      });
  }

  constructor() {
    super();
    this.isSignInWithEmailLink();
  }

  /**
   * @inheritDoc
   */
  componentWillMount() {
    if(typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      this.web3 = new Web3(window.web3.currentProvider);
    }

    // For manual phone sign-in
    /*
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
      'size': 'invisible',
      'callback': function(response) {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        onSignInSubmit();
      }
    });

    window.recaptchaVerifier.render().then(function(widgetId) {
      window.recaptchaWidgetId = widgetId;
    });
    */
  }

  /**
   * @inheritDoc
   */
  componentDidMount() {
    this.unregisterAuthObserver = firebaseApp.auth().onAuthStateChanged((user) => {
      this.setState({isSignedIn: !!user});
    });
  }

  /**
   * @inheritDoc
   */
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  /**
   * @inheritDoc
   */
  render() {
    return (
      <div className={styles.container}>
        <div className={styles.logo}>
          <i className={styles.logoIcon + ' material-icons'}>photo</i> Meta Attestation
        </div>
        <div className={styles.caption}>This is a cool demo app</div>
        {this.state.isSignedIn !== undefined && !this.state.isSignedIn &&
          <div>
            <StyledFirebaseAuth
              className={styles.firebaseUi}
              uiConfig={this.uiConfig}
              firebaseAuth={firebaseApp.auth()}
            />
            <center>
              <input type="text" id="email" placeholder="Put your email" />
              <button type="button" onClick={() => this.sendSignInLinkToEmail()}>Sign in with Email link</button>
            </center>
          </div>
        }
        {this.state.isSignedIn &&
          <div className={styles.signedIn}>
            Hello {firebaseApp.auth().currentUser.displayName}. You are now signed In!
            <a className={styles.button} onClick={() => firebaseApp.auth().signOut()}>Sign-out</a>
          </div>
        }
      </div>
    );
  }
}

// Load the app in the browser.
ReactDOM.render(<App/>, document.getElementById('app'));
