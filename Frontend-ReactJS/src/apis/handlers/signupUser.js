// Frontend-ReactJS/src/apis/handlers/signupUser.js
import { api } from "../axios";
import { apiEndpoints } from "../apiEndpoints";

/**
 * Makes API call to register a new user.
 * @param {object} data - { name, email, password, phone, about, photo, role, education, experience }
 * @returns {Promise<object>} - { response: bool, status: int, message: string }
 */
export function signupUser(data) {
  const res = {
    response: false,
    status: 400,
    message: ""
  };

  if (!data.email || !data.password || !data.name) {
    res.message = "Error: Missing required fields.";
    return Promise.resolve(res);
  }

  const signup = async () => {
    try {
      const response = await api.post(apiEndpoints.signup, data, {
        validateStatus: () => true
      });

      const status = response.request.status;

      switch (status) {
        case 201:
          res.response = true;
          res.status = 201;
          res.message = "";
          break;
        case 409:
          res.status = 409;
          res.message = response.data?.error || "Error: Email already in use.";
          break;
        case 400:
          res.status = 400;
          res.message = response.data?.error || "Error: Invalid input.";
          break;
        default:
          res.status = status;
          res.message = "Error: Please refresh the page and try again.";
          break;
      }
    } catch {
      res.message = "Error: Please refresh the page and try again.";
    }
    return res;
  };

  return signup();
}
