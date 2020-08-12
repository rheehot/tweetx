import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Feed from '../feed/Feed';
import Profile from '../profile/Profile';
import ProfileFollowings from '../profile/ProfileFollowings';
import ProfileFollowers from '../profile/ProfileFollowers';
import Users from '../users/Users';
import Post from '../post/Post';
import CreatePost from '../posts/CreatePost';
import Logout from '../auth/Logout';
import Landing from '../layouts/Landing';
import LoginOrRegister from '../auth/LoginOrRegister';
import Login from '../auth/Login';
import Register from '../auth/Register';
import EditProfile from '../auth/EditProfile';
import ResetPassword from '../auth/ResetPassword';
import ResetPasswordConfirm from '../auth/ResetPasswordConfirm';
import NotFound from '../layouts/NotFound';

const Routes = (props) => {
  return (
    <div id="main" className="container">
      {/* alert component */}
      <Switch>
        <Route exact path="/" component={Landing} />
        <Route exact path="/feed" component={Feed} />
        <Route exact path="/profile" component={Profile} />
        <Route exact path="/profile-followings" component={ProfileFollowings} />
        <Route exact path="/profile-followers" component={ProfileFollowers} />
        <Route exact path="/users" component={Users} />
        <Route exact path="/post" component={Post} />
        <Route exact path="/new-post" component={CreatePost} />
        <Route exact path="/logout" component={Logout} />
        <Route exact path="/login-or-register" component={LoginOrRegister} />
        <Route exact path="/login" component={Login} />
        <Route exact path="/register" component={Register} />
        <Route exact path="/edit-profile" component={EditProfile} />
        <Route exact path="/reset-password" component={ResetPassword} />
        <Route
          exact
          path="/reset-password-confirm"
          component={ResetPasswordConfirm}
        />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

Routes.propTypes = {};

export default Routes;
