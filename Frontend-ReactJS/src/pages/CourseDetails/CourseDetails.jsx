import React, { useState } from "react";
import "./CourseDetails.css";
import { useNavigate, useLocation } from "react-router-dom";

function CourseDetails(){
  const navigate = useNavigate();
  const location = useLocation();
  const [openSection, setOpenSection] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const courseFromState = location.state?.course;

  if(!courseFromState){
    return(
      <div style={{textAlign:"center",padding:"100px",fontSize:"18px"}}>
        <p>No course selected.</p>
        <button onClick={()=>navigate("/bootcamp")} style={{marginTop:"20px",padding:"10px 24px",background:"#2f6df6",color:"white",border:"none",borderRadius:"20px",cursor:"pointer"}}>
          Back to Bootcamp
        </button>
      </div>
    );
  }

  const course = {
    subtitle: "System Hacking, type of security, deep & dark web, VPN, Protections of E-mails, Phishing, Malwares, Antivirus",
    rating: 4.7,
    reviews: 13336,
    students: 25,
    maxStudents: 30,
    totalSections: 10,
    totalLectures: 23,
    totalDuration: "4h 57m",
    whatYouLearn: [
      "Hacking","Type of Security","Malwares","Antivirus",
      "Hacking","Basics of computer networking","Deep web and dark web",
      "Protection of E-mails","Projection of ATM",
      "Firewall and its configuration","How to choose right antivirus",
      "Hackers","IFS and OS"
    ],
    relatedTopics: ["Cyber Security","Network & Security","IT & Software"],
    sections: [
      { title:"course content introduction, Cyber security, type", lectures:3, duration:"28min",
        items:["Introduction","Cyber security definition type, job roles available, cyber security skills set","Cyber security network type and system hacking"],
        durations:["8:12","7:06","12:56"]
      },
      { title:"Web server, Hacker, Malware, System hacker", lectures:3, duration:"23min", items:[], durations:[] },
      { title:"Phishing, projection of e-mails, basics of computer network", lectures:4, duration:"42min", items:[], durations:[] },
      { title:"Virtual private network (VPN)", lectures:1, duration:"14min", items:[], durations:[] },
      { title:"Anti-virus, Anti Malware, How to choose right antivirus", lectures:4, duration:"30min", items:[], durations:[] },
      { title:"Social engineering in Cyber security", lectures:1, duration:"24min", items:[], durations:[] },
    ],
   bootcamps: [
  { id:2, title:"Cybersecurity:(SOC) Analyst", expert:"Bavly", price:"££299.99", rating:4.8, image:"https://images.unsplash.com/photo-1518770660439-4636190af475" },
  { id:3, title:"Ethical Hacking", expert:"Mina", price:"££299.99", rating:4.8, image:"https://images.unsplash.com/photo-1555949963-aa79dcee981c" },
  { id:4, title:"Linux Fundamentals", expert:"Mokter", price:"££299.99", rating:4.8, image:"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5" },
  { id:5, title:"Network Security", expert:"Bavly", price:"££249.99", rating:4.7, image:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31" },
],
    ...courseFromState
  };

  const renderStars = (rating) => Array.from({length:5},(_,i)=>(
    <span key={i} style={{color: i < Math.round(rating) ? "#f5a623":"#ccc", fontSize:"14px"}}>★</span>
  ));

  const visibleLearn = showMore ? course.whatYouLearn : course.whatYouLearn.slice(0,8);

  return(
    <div className="cd-page">

      {/* Banner */}
      <div className="cd-banner">
        <div className="cd-banner-left">
          <h1>{course.title}</h1>
          <p className="cd-subtitle">{course.subtitle}</p>
          <div className="cd-rating-row">
            {renderStars(course.rating)}
            <span className="cd-rating-num">{course.rating}</span>
            <span className="cd-reviews">{course.reviews?.toLocaleString()} ratings</span>
          </div>
          <p className="cd-expert">Expert : {course.expert}</p>
        </div>
        <div className="cd-banner-img">
          <img src={course.image} alt={course.title}/>
        </div>
      </div>

      {/* Body */}
      <div className="cd-body">

        <div className="cd-main">

          {/* What You'll Learn */}
          <div className="cd-box">
            <h2>what you'll learn</h2>
            <div className="cd-learn-grid">
              {visibleLearn.map((item,i)=>(
                <div key={i} className="cd-learn-item">• {item}</div>
              ))}
            </div>
            {course.whatYouLearn.length > 8 && (
              <button className="cd-show-more" onClick={()=>setShowMore(!showMore)}>
                {showMore ? "Show less ▲" : "Show more ▼"}
              </button>
            )}
          </div>

          {/* Related Topics */}
          <div className="cd-related">
            <h2>Explore related topics</h2>
            <div className="cd-topics-row">
              {course.relatedTopics.map((t,i)=>(
                <span key={i} className="cd-topic-tag">{t}</span>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="cd-sidebar">
          <p className="cd-price">{course.price}</p>
          <button className="cd-buy-btn">Buy Now</button>
          <div className="cd-includes">
            <p className="cd-includes-title">This course includes:</p>
            <p>• 5 hours on-demand video</p>
            <p>• Access on mobile and TV</p>
            <p>• Full lifetime access</p>
            <p>• Closed captions</p>
            <p>• Certificate of completion</p>
          </div>
          <p className="cd-students"><strong>Student:</strong> ({course.students}/{course.maxStudents})</p>
          <button className="cd-share-btn">Share</button>
        </div>

      </div>

      {/* Full Width */}
      <div className="cd-full-width">

        <div className="cd-content-section">
          <h2>Course content</h2>
          <p className="cd-content-meta">{course.totalSections} sections • {course.totalLectures} lectures • {course.totalDuration} total length</p>
          <div className="cd-accordion">
            {course.sections.map((sec,i)=>(
              <div key={i} className="cd-acc-item">
                <div className="cd-acc-header" onClick={()=>setOpenSection(openSection===i?-1:i)}>
                  <span>{openSection===i?"▲":"▼"} {sec.title}</span>
                  <span className="cd-sec-meta">{sec.lectures} lecture{sec.lectures>1?"s":""} • {sec.duration}</span>
                </div>
                {openSection===i && sec.items?.length>0 && (
                  <div className="cd-acc-body">
                    {sec.items.map((item,j)=>(
                      <div key={j} className="cd-lecture-row">
                        <span>{item}</span>
                        <span>{sec.durations[j]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="cd-requirements">
          <h2>Requirements</h2>
          <p><em>Learner should be from engineering / technical background.</em></p>
        </div>

        {course.bootcamps?.length>0 && (
          <div className="cd-bootcamps">
            <h2>Bootcamps</h2>
            <div className="cd-bootcamps-row">
              {course.bootcamps.map(b=>(
                <div key={b.id} className="cd-bc-card" onClick={()=>navigate("/course",{state:{course:b}})}>
                  <img src={b.image} alt={b.title}/>
                  <div className="cd-bc-info">
                    <p className="cd-bc-title">{b.title}</p>
                    <p className="cd-bc-expert">Expert : {b.expert}</p>
                    <div className="cd-bc-rating">{renderStars(b.rating)} <span>{b.rating}</span></div>
                    <p className="cd-bc-price">{b.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CourseDetails;