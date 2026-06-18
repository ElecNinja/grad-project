export const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"

export const apiEndpoints = {
 signup: `${baseUrl}/api/signup`,
 login: `${baseUrl}/api/login`,
 getUser: `${baseUrl}/api/me`,
 logout: `${baseUrl}/api/logout`,
 deleteAcct: `${baseUrl}/api/deleteMe`,
 getOffers: `${baseUrl}/api/teacher/offers`,        
 acceptOffer: `${baseUrl}/api/teacher/accept-offer`, 
}