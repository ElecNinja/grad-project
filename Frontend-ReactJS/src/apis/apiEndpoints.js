export const baseUrl = "http://localhost:3000"

export const apiEndpoints = {
  signup: `${baseUrl}/api/signup`,
  login: `${baseUrl}/api/login`,
  logout: `${baseUrl}/api/logout`,
  deleteAcct: `${baseUrl}/api/deleteMe`,
  getMe: `${baseUrl}/api/me`,
  createRequest: `${baseUrl}/api/student/request`,   // ✅ added
  getMyRequests: `${baseUrl}/api/student/requests`,  // ✅ added
  getOffers: `${baseUrl}/api/teacher/offers`,
  acceptOffer: `${baseUrl}/api/teacher/accept-offer`,
 getTeachers: `${baseUrl}/api/teacher/list`,
 getTeacherProfile: `${baseUrl}/api/teacher/profile`,
 updateTeacherProfile: `${baseUrl}/api/teacher/profile`,
 getStudentProfile: `${baseUrl}/api/teacher/student/profile`,
 updateStudentProfile: `${baseUrl}/api/teacher/student/profile`,
}