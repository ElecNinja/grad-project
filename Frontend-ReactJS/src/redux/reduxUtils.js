import { store } from "./store"
import { setUser, setUserLogout } from "./userSlice";

export function setReduxLogInUser(name, email, role, profile, photo, id) {
  let dataIsValid = (name !== "") && (email !== "");

  if (dataIsValid) {
    const userData = {
      id: id || null,
      name: name,
      email: email,
      role: role,
      profile: profile || null,
      avatar: photo,
      loggedIn: true
    };
    store.dispatch(setUser(userData));
    return true;
  } else {
    console.error("Redux encountered an error: user data invalid")
    store.dispatch(setUserLogout());
    return false;
  }
}

export function setReduxLogOutUser() {
  store.dispatch(setUserLogout());
  return true;
}