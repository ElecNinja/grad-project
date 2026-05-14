import { store } from "./store"
import { setUser, setUserLogout } from "./userSlice";

export function setReduxLogInUser(name, email, role, profile, photo, id) {
  // Validate that name and email are not empty
  let dataIsValid = (name !== "") && (email !== "");

  if (dataIsValid) {
    // Build user object with all data from backend
    const userData = {
      id: id || null,
      name: name,         // full_name from backend
      email: email,
      role: role,
      profile: profile || null,
      avatar: photo,      // avatar_url from backend
      loggedIn: true
    };

    // Dispatch user data to Redux store
    store.dispatch(setUser(userData));
    return true;

  } else {
    // If data is invalid, log out user and return false
    console.error("Redux encountered an error: user data invalid");
    store.dispatch(setUserLogout());
    return false;
  }
}

export function setReduxLogOutUser() {
  // Clear user data from Redux store
  store.dispatch(setUserLogout());
  return true;
}