export const baseUrl = import.meta.env.VITE_API_URL;

export const apiEndpoints = {
  signup: `${baseUrl}/api/signup`,
  login: `${baseUrl}/api/login`,
  logout: `${baseUrl}/api/logout`,
  deleteAcct: `${baseUrl}/api/deleteMe`,
  getMe: `${baseUrl}/api/me`,
  createRequest: `${baseUrl}/api/student/request`,   // ✅ added
  getMyRequests: `${baseUrl}/api/student/requests`,  // ✅ added
  getAcceptedOffers: `${baseUrl}/api/student/accepted-offers`,  // ✅ added
  getTeacherAcceptedOffers: `${baseUrl}/api/teacher/accepted-offers`,  // ✅ added
  getOffers: `${baseUrl}/api/teacher/offers`,
  acceptOffer: `${baseUrl}/api/teacher/accept-offer`,
 getTeachers: `${baseUrl}/api/teacher/list`,
 getTeacherProfile: `${baseUrl}/api/teacher/profile`,
 updateTeacherProfile: `${baseUrl}/api/teacher/profile`,
 getStudentProfile: `${baseUrl}/api/teacher/student/profile`,
 updateStudentProfile: `${baseUrl}/api/teacher/student/profile`,
 getTeacherReviews: `${baseUrl}/api/teacher/profile`,      // /:id/reviews appended at call site
 getRecommendedTeachers: `${baseUrl}/api/teacher/profile`,  // /:id/recommended appended at call site
}