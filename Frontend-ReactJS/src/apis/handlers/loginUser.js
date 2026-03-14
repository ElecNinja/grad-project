// Frontend-ReactJS/src/apis/handlers/loginUser.js
import { api } from "../axios"
import { apiEndpoints } from "../apiEndpoints"
import { emailValidation, passwordValidation } from "../../utils/authUtils"
import { setReduxLogInUser } from "../../redux/reduxUtils";

export function loginUser(data) {
    const email = data.email ? data.email : false;
    const password = data.password ? data.password : false;
    const remember = !!data.remember;
    const role = data.role || 'student'; // ✅

    const errorResponse = {
        response: false,
        status: 400,
        message: "Error: Invalid input."
    };

    if (!email || !password) {
        return Promise.resolve(errorResponse)
    };

    const passwordIsValid = passwordValidation(password);
    const emailIsValid = emailValidation(email);
    const dataIsValid = emailIsValid.response && passwordIsValid.response;

    if (!dataIsValid) {
        return Promise.resolve(errorResponse)
    }

    let requestData = {
        "email": email,
        "password": password,
        "remember": remember,
        "role": role  // ✅
    }

    let res = {
        response: false,
        status: 400,
        message: ""
    }

    const logInRequest = async () => {
        try {
            const response = await api.post(apiEndpoints.login, requestData, {
                validateStatus: () => true
            });

            let responseStatus = response.request.status;

            switch (responseStatus) {
                case 200:
                    let userIsLoggedIn = setReduxLogInUser(
                        response.data.user.name,
                        response.data.user.email
                    )
                    res.response = userIsLoggedIn;
                    res.message = userIsLoggedIn ? "" : "Error: Registration failed."
                    break;
                case 400:
                case 401:
                case 403:
                    res.message = response.data?.error || "Error: Credentials invalid."
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
    return logInRequest()
}