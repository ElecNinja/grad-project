# Testing Guide - StudyBuddy Work/Course Flow

## Overview

This guide demonstrates the complete flow from **Teacher uploading work** → **Student discovering it** → **Seeing courses in the Work page**.

---

## Flow Architecture

### 1. **Student Creates a Request** (Add Material page)

- Student uploads material with 3 options:
    - **Bootcamp** (📚 long course)
    - **Recorded Video** (🎥 video course)
    - **Live Meeting** (👥 1-on-1 session)

### 2. **Teacher Accepts the Offer** (Offers page)

- Teacher reviews student requests
- Sets a price per hour
- Clicks "Accept" to create a course

### 3. **Student Sees Course in Work** (Work page)

- View all 3 course types with tabs:
    - **Bootcamp** tab
    - **Recorded** tab
    - **Live Sessions** tab

---

## Step-by-Step Testing Instructions

### **Test Environment Setup**

```bash
# Terminal 1 - Backend (port 3000)
cd Backend-ExpressJS
npm start

# Terminal 2 - Frontend (port 5174)
cd Frontend-ReactJS
npm run dev
```

Open: `http://localhost:5174`

---

## **Scenario 1: Complete Student → Teacher → Course Flow**

### Step 1: Student Signup & Login

1. Navigate to `/signup`
2. Register as:
    - **Email**: `student1@gmail.com`
    - **Password**: `test123`
    - **Role**: Student
    - **Name**: Test Student
3. Login at `/login`

### Step 2: Student Creates Request (Add Material)

1. Click **"Add Material"** in navbar
2. Fill the form:
    - **Title**: "Help with Python Programming"
    - **Description**: "Need help with advanced Python concepts"
    - **Material Type**: Select one:
        - `Bootcamp` (multi-session course)
        - `Record Video` (recorded course)
        - `Meeting` (live 1-on-1)
    - **Upload a PDF** (optional): Can drag any PDF file
3. Click **"Submit Request"**
4. ✅ Should see success message
5. **Redirect**: Goes to `/work` page (empty - no courses yet)

### Step 3: Teacher Signup & Login

1. **Logout** from student account (button in navbar)
2. Go to `/signup`
3. Register as:
    - **Email**: `teacher1@gmail.com`
    - **Password**: `test123`
    - **Role**: Teacher
    - **Name**: Expert Teacher
    - **Subject**: Programming
    - **Hourly Rate**: 50
4. Login at `/login`

### Step 4: Teacher Reviews Student Request (Offers page)

1. Click **"Offers"** in navbar (teacher-only page)
2. You'll see:
    - Student's request with title and description
    - Student's name
    - The material type (Bootcamp/Video/Meeting)
    - PDF download button (if file uploaded)
    - AI Summary button
3. **Accept the Offer**:
    - Enter price in **"Set price"** field (e.g., 50)
    - Click **"Accept"** button
4. ✅ Should see "Accepted ✓" status
5. Offer disappears from list after ~800ms

### Step 5: Student Sees Course in Work Page

1. **Logout** from teacher
2. **Login** back as student (`student1@gmail.com`)
3. Click **"Work"** in navbar
4. You'll see:
    - A new course appears!
    - **Stats** at top showing:
        - Total Active courses: 1
        - Bootcamp/Recorded/Live Sessions counts
5. **Course Details**:
    - Course title
    - Course type (Bootcamp/Recorded/Live)
    - Teacher name
    - Price per hour
    - Bid status: "accepted"

### Step 6: Filter by Course Type

1. Click tabs in Work page:
    - **"All"** - shows all 3 types
    - **"Bootcamp"** - shows bootcamp courses only
    - **"Recorded"** - shows video courses only
    - **"Live Sessions"** - shows 1-on-1 sessions only
2. Count should update next to tab name
3. ✅ Filtering works correctly

### Step 7: Refresh Courses

1. Click **"🔄 Refresh"** button at bottom
2. ✅ Courses list re-fetches without page reload

---

## **Scenario 2: Multiple Courses**

### Create 3 Different Course Types

1. **Logout** and login as student again
2. Create 3 separate requests:
    - Request 1: Type = **Bootcamp**
    - Request 2: Type = **Record Video**
    - Request 3: Type = **Meeting**
3. For each, go through the Add Material flow
4. **Logout** and login as teacher
5. Go to Offers page
6. Accept all 3 with different prices:
    - Request 1: $45/hr
    - Request 2: $35/hr
    - Request 3: $60/hr
7. **Logout** and login as student
8. Go to Work page
9. ✅ You should see all 3 courses
10. ✅ Click each tab - courses appear in correct category

---

## **Key Features to Test**

### Mobile Responsiveness

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Resize to mobile (375px width)
4. ✅ Hamburger icon should be **visible and clickable**
5. ✅ Logout button should show with icon
6. ✅ Mobile menu opens/closes smoothly

### Logout Button

- Desktop: Should show **"Log Out"** with icon (red gradient button)
- Mobile: Should show **icon + text** in mobile menu
- ✅ Hover effect should work smoothly
- ✅ Click should logout and redirect to login

### Hamburger Menu

- ✅ Should appear only on screens < 1024px wide
- ✅ Icon should be **fully visible** (not empty square)
- ✅ Clicking opens/closes menu smoothly
- ✅ Closing menu should work on navigation clicks

---

## **Testing Checklist**

- [ ] Student can create request with all 3 material types
- [ ] Teacher receives request in Offers page
- [ ] Teacher can accept with custom price
- [ ] Student sees course in Work page with correct type
- [ ] Course filtering by type works (All/Bootcamp/Recorded/Live)
- [ ] Stats update correctly (Total, Bootcamp, Recorded, Sessions)
- [ ] Refresh button fetches updated courses
- [ ] Logout button is modern (red gradient, icon+text)
- [ ] Mobile hamburger icon is visible
- [ ] Mobile menu opens/closes correctly
- [ ] Console has no errors or console.log statements

---

## **Troubleshooting**

### Course not appearing in Work page after teacher accepts

1. Check browser console (F12) for errors
2. Ensure teacher is accepting from correct student's request
3. Try clicking Refresh button
4. Check backend logs for API errors

### Hamburger icon still invisible

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh page (Ctrl+Shift+R)
3. Check if mobile viewport is active (F12 > toggle device)
4. Verify width is < 1024px

### Logout button styling not applied

1. Hard refresh browser cache
2. Check if header.css was saved correctly
3. Restart dev server

---

## **Database Schema Notes**

### Student Request Creation

- Table: `student_requests`
- Stores: title, description, preferred_mode (bootcamp/recorded/live_1on1)
- Triggers: AI matching to find suitable teachers

### Course Data

- Linked through: `bids` table (teacher's acceptance)
- Fields: price, currency, teaching_mode, num_sessions, status
- Status: "pending" → "accepted"

### Student's Work Page Query

- Fetches: `/api/student/accepted-offers`
- Returns: All requests with accepted bids
- Filters: By type (bootcamp, recorded, live_1on1)

---

## **File Locations for Reference**

### Frontend Components

- **Work Page**: `Frontend-ReactJS/src/pages/work/Work.jsx`
- **Add Material**: `Frontend-ReactJS/src/pages/Addmaterial/Addmaterial.jsx`
- **Offers Page**: `Frontend-ReactJS/src/pages/Offers/offer.jsx`
- **Header**: `Frontend-ReactJS/src/components/Header/Header.jsx`

### Backend Routes

- **Student Routes**: `Backend-ExpressJS/routes/student.js`
- **Teacher Routes**: `Backend-ExpressJS/routes/teacher.js`

### Backend Controllers

- **Student**: `Backend-ExpressJS/controllers/studentController.js`
- **Teacher**: `Backend-ExpressJS/controllers/teacherController.js`

---

## **Expected Behavior Summary**

| Action                  | Page         | Expected Result                   |
| ----------------------- | ------------ | --------------------------------- |
| Student creates request | Add Material | Redirects to Work page (empty)    |
| Teacher accepts offer   | Offers       | "Accepted ✓" shown, offer removed |
| Student refreshes Work  | Work         | New course appears with tabs      |
| Click course type tab   | Work         | Filters to show only that type    |
| Logout on desktop       | Navbar       | Red gradient button with icon     |
| Logout on mobile        | Mobile Menu  | Logout option with icon visible   |
| Resize to mobile        | Any page     | Hamburger icon appears            |
