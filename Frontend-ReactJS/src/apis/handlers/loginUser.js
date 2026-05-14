import { api } from "../axios"
import { apiEndpoints } from "../apiEndpoints"
import { emailValidation, passwordValidation } from "../../utils/authUtils"
import { setReduxLogInUser } from "../../redux/reduxUtils";

export function loginUser(data) {
  const email = data.email ? data.email : false;
  const password = data.password ? data.password : false;
  const remember = !!data.remember;
  const role = data.role || 'student';

  const errorResponse = {
    response: false,
    status: 400,
    message: "Error: Invalid input."
  };

  if (!email || !password) return Promise.resolve(errorResponse);

  const passwordIsValid = passwordValidation(password);
  const emailIsValid = emailValidation(email);
  const dataIsValid = emailIsValid.response && passwordIsValid.response;

  if (!dataIsValid) return Promise.resolve(errorResponse);

  let requestData = { email, password, remember, role };
  let res = { response: false, status: 400, message: "" };

  const logInRequest = async () => {
    try {
      const response = await api.post(apiEndpoints.login, requestData, {
        validateStatus: () => true
      });

      switch (response.status) {
        case 200: {
          // Save user data and token in Redux
          let userIsLoggedIn = setReduxLogInUser(
            response.data.user.full_name,
            response.data.user.email,
            response.data.user.role,
            response.data.profile,
            response.data.user.avatar_url,
            response.data.user.id,
            response.data.token // ✅ pass token to Redux
          );
          res.response = userIsLoggedIn;
          res.message = userIsLoggedIn ? "" : "Error: Login failed.";
          break;
        }
        case 400:
        case 401:
        case 403:
          res.message = response.data?.error || "Error: Credentials invalid.";
          break;
        default:
          res.message = "Error: Please refresh the page and try again.";
          break;
      }
    } catch {
      res.message = "Error: Please refresh the page and try again.";
    }
    return res;
  };

  return logInRequest();
}