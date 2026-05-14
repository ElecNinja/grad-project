import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  loggedIn: false,
  id: null,
  email: "",
  name: "",
  role: "",
  profile: null,
  avatar: "",
  token: null, // ✅ added
}

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.loggedIn = action.payload.loggedIn;
      state.id = action.payload.id || null;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.profile = action.payload.profile;
      state.avatar = action.payload.avatar;
      state.token = action.payload.token || null; // ✅ added
    },
    setUserLogout: (state) => {
      state.loggedIn = false;
      state.id = null;
      state.email = "";
      state.name = "";
      state.role = "";
      state.profile = null;
      state.avatar = "";
      state.token = null; // ✅ added
    },
  }
});

const userReducer = userSlice.reducer;
export const { setUser, setUserLogout } = userSlice.actions;
export default userReducer;