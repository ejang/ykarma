import React from 'react';
import { auth, fbase } from '../fbase';
import Api from '../store/Api';

class LinkEmail extends React.Component {

  componentDidMount() {
    fbase.auth.onAuthStateChanged(function (user) {
      if (user) {
        auth.linkEmailViaEmailLink(user, window.location.href).then(result => {
          window.localStorage.removeItem('emailForLinkIn');
         localStorage.setItem("additionalEmailInfo", JSON.stringify(result.additionalUserInfo));
          Api.addUrl(result.user.email).then(() => {
            window.location.href = '/profile';
          });
        })
        .catch(function(error) {
          console.log("Firebase sign-in error", error);
        });
      }
    });
  }

  render() {
    return (
      <div>Linking your email...</div>
    )
  }
}

export default LinkEmail;