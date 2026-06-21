import { api } from "../axios"
import { apiEndpoints } from "../apiEndpoints"
import { setReduxLogInUser } from "../../redux/reduxUtils";

const clearAuthToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("supabase_access_token");
  delete api.defaults.headers.common.Authorization;
};

export function getUser() {
  let res = {
    response: false,
    status: 400,
    message: ""
  }

  const reqUserData = async () => {
    try {
      const response = await api.get(apiEndpoints.getMe, {
        validateStatus: () => true
      });

      let responseStatus = response.status;

      switch (responseStatus) {
        case 200: {
          const user = response.data?.user || {};
          const name = user.full_name || user.name || "";
          const email = user.email || "";
          const role = user.role || "";
          const avatar = user.avatar_url || user.photo || "";
          const id = user.id || null;

          // Save hydrated user data to Redux
          let userIsLoggedIn = setReduxLogInUser(
            name,
            email,
            role,
            user,
            avatar,
            id
          )
          res.status = 200;
          res.response = userIsLoggedIn;
          res.message = userIsLoggedIn ? "" : "Error: failed to get user."
          break;
        }
        case 400:
        case 401:
        case 403:
          clearAuthToken();
          res.message = response.data?.error || "Error: Unauthorized."
          break;
        default:
          res.message = "Error: Please refresh the page and try again."
          break;
      }
    } catch {
      res.message = "Error: Please refresh the page and try again."
    }
    return res;
  }
  return reqUserData()
}