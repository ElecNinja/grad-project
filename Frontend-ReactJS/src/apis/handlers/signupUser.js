// Frontend-ReactJS/src/apis/handlers/signupUser.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function signupUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // مهم لو بتستخدم sessions
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        username: userData.username,
      }),
    });

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      message: data.message,
      user: data.data?.user || null,
    };

  } catch (error) {
    console.error('Signup request failed:', error);
    return {
      success: false,
      status: 500,
      message: 'Error: Could not connect to server.',
      user: null,
    };
  }
}
