import { api } from "../axios"
import { setReduxLogOutUser } from "../../redux/reduxUtils";
import { apiEndpoints } from "../apiEndpoints";
import { store } from "../../redux/store";         // add this
import { clearChatState } from "../../redux/chatSlice"; // add this

const clearAuthToken = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem("supabase_access_token");
    delete api.defaults.headers.common.Authorization;
};

/**
 * Function makes api call to logout the user, and also logs out user from the redux store.
 * 
 * Takes no parameters and returns an object with a response key and boolean value.
 * 
 * @returns {Promise<object>} // with boolean response
 * 
 * @example
 * // Response from logoutUser:
 * {
        response: true,
    }
    // an error response might yield:
    {
        response: false
    }
 */
export function logoutUser() {
    // preparing the returned response
    let res = {
        response: false,
    }

    const token = (typeof window !== "undefined")
      ? window.localStorage.getItem("supabase_access_token")
      : null;

    // making the request (log out backend)
    const logout = async () => {
        try {
            const response = await api.post(
              apiEndpoints.logout,
              {},
              {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                validateStatus: () => true,
              }
            )

            let responseStatus = response.status;

            if (responseStatus === 200) {
                res.response = true;
            }

        }
        catch (error) {
            console.warn(`Api handler logout encountered an error: ${error}`)
        } finally {
            // Always clear client auth state, even if backend request fails.
            setReduxLogOutUser();
            // Clear the chat state
            store.dispatch(clearChatState());
            clearAuthToken();
        }
        return res;
    }

    return logout();
}