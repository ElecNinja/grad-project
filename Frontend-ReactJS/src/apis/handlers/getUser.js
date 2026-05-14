import { api } from "../axios"
import { apiEndpoints } from "../apiEndpoints"
import { setReduxLogInUser } from "../../redux/reduxUtils";

export function getUser() {
  let res = {
    response: false,
    status: 400,
    message: ""
  }

  const reqUserData = async () => {
    try {
      const response = await api.get(apiEndpoints.getUser, {
        validateStatus: () => true
      });

      let responseStatus = response.status;

      switch (responseStatus) {
        case 200: {
          // Save user data including id to Redux
          let userIsLoggedIn = setReduxLogInUser(
            response.data.user.name,
            response.data.user.email,
            response.data.user.role,
            null,
            response.data.user.photo,
            response.data.user.id
          )
          res.status = 200;
          res.response = userIsLoggedIn;
          res.message = userIsLoggedIn ? "" : "Error: failed to get user."
          break;
        }
        case 400:
        case 401:
        case 403:
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