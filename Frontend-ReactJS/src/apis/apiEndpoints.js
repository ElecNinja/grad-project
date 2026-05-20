export const baseUrl = "http://localhost:3000"

export const apiEndpoints = {
 signup: `${baseUrl}/api/signup`,
 login: `${baseUrl}/api/login`,
 getUser: `${baseUrl}/api/me`,
 logout: `${baseUrl}/api/logout`,
 deleteAcct: `${baseUrl}/api/deleteMe`,
 getOffers: `${baseUrl}/api/teacher/offers`,        
 acceptOffer: `${baseUrl}/api/teacher/accept-offer`, 
 getTeachers: `${baseUrl}/api/teacher/list`,
 getTeacherProfile: `${baseUrl}/api/teacher/profile`,
 updateTeacherProfile: `${baseUrl}/api/teacher/profile`,
 getStudentProfile: `${baseUrl}/api/teacher/student/profile`,
 updateStudentProfile: `${baseUrl}/api/teacher/student/profile`,
}