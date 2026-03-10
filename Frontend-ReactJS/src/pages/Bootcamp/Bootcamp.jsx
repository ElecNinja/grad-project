import React, { useState, useRef } from "react";
import "./Bootcamp.css";
import { useNavigate } from "react-router-dom";
import CreateBootcampPopup from "../../components/CreateBootcampPopup/CreateBootcampPopup";

function Bootcamp(){

const navigate = useNavigate();
const [openPopup, setOpenPopup] = useState(false);
const scrollRefs = useRef({});

const categories = [
  {
    name: "Cyber Security",
    courses: [
      { id:1, title:"Introduction to Cyber Security", expert:"Bavly", price:"££279.99", rating:4.7, reviews:100, badge:null, image:"https://images.unsplash.com/photo-1550751827-4bd374c3f58b" },
      { id:2, title:"Cybersecurity (SOC) Analyst", expert:"Mina", price:"££299.99", rating:4.9, reviews:4000, badge:"Highest Rated", image:"https://images.unsplash.com/photo-1518770660439-4636190af475" },
      { id:3, title:"Ethical Hacking", expert:"Mina", price:"££149.99", rating:4.6, reviews:10, badge:"New", image:"https://images.unsplash.com/photo-1555949963-aa79dcee981c" },
      { id:4, title:"Network Security Fundamentals", expert:"Bavly", price:"££199.99", rating:4.8, reviews:250, badge:null, image:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31" },
      { id:5, title:"Penetration Testing", expert:"Mina", price:"££349.99", rating:4.9, reviews:180, badge:"Highest Rated", image:"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5" },
      { id:6, title:"Cloud Security", expert:"Bavly", price:"££259.99", rating:4.5, reviews:90, badge:null, image:"https://images.unsplash.com/photo-1544197150-b99a580bb7a8" },
    ]
  },
  {
    name: "Artificial Intelligence",
    courses: [
      { id:7, title:"Prompt Engineering", expert:"Bavly", price:"££279.99", rating:4.7, reviews:100, badge:null, image:"https://images.unsplash.com/photo-1677442135703-1787eea5ce01" },
      { id:8, title:"Computer Vision", expert:"Mina", price:"££299.99", rating:4.9, reviews:4000, badge:"Highest Rated", image:"https://images.unsplash.com/photo-1635070041078-e363dbe005cb" },
      { id:9, title:"Generative AI", expert:"Mina", price:"££149.99", rating:4.6, reviews:10, badge:"New", image:"https://images.unsplash.com/photo-1555949963-aa79dcee981c" },
      { id:10, title:"Machine Learning Basics", expert:"Bavly", price:"££229.99", rating:4.8, reviews:320, badge:null, image:"https://images.unsplash.com/photo-1555949963-aa79dcee981c" },
      { id:11, title:"Deep Learning", expert:"Mina", price:"££319.99", rating:4.9, reviews:500, badge:"Highest Rated", image:"https://images.unsplash.com/photo-1518770660439-4636190af475" },
      { id:12, title:"NLP & ChatBots", expert:"Bavly", price:"££189.99", rating:4.4, reviews:60, badge:"New", image:"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5" },
    ]
  },
  {
    name: "Web Development",
    courses: [
      { id:13, title:"React.js Masterclass", expert:"Bavly", price:"££199.99", rating:4.9, reviews:800, badge:"Highest Rated", image:"https://images.unsplash.com/photo-1633356122544-f134324a6cee" },
      { id:14, title:"Full Stack Development", expert:"Mina", price:"££349.99", rating:4.8, reviews:600, badge:null, image:"https://images.unsplash.com/photo-1627398242454-45a1465c2479" },
      { id:15, title:"Node.js & Express", expert:"Bavly", price:"££179.99", rating:4.7, reviews:400, badge:null, image:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31" },
      { id:16, title:"UI/UX Design", expert:"Mina", price:"££159.99", rating:4.6, reviews:200, badge:"New", image:"https://images.unsplash.com/photo-1561070791-2526d30994b5" },
      { id:17, title:"Next.js Advanced", expert:"Bavly", price:"££249.99", rating:4.8, reviews:150, badge:"Highest Rated", image:"https://images.unsplash.com/photo-1544197150-b99a580bb7a8" },
    ]
  }
];

const renderStars = (rating) => {
  return Array.from({length:5}, (_,i) => (
    <span key={i} style={{color: i < Math.round(rating) ? "#f5a623" : "#ccc", fontSize:"14px"}}>★</span>
  ));
};

return(
  <div className="bootcamp-page">
    <div className="container">

      <input className="search" placeholder="Find someone who makes learning easy..."/>

      <div className="filters">
        <button className="filter-btn">⚙ Filter & Sort</button>
        <select className="dropdown"><option>Topic</option><option>Cyber Security</option><option>AI</option><option>Web Dev</option></select>
        <select className="dropdown"><option>Level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <button className="create-btn" onClick={()=>setOpenPopup(true)}>Create Boot Camp</button>
      </div>

      {categories.map(category => (
        <div key={category.name} className="category-section">
          <h2>{category.name}</h2>
          <div className="courses-wrapper">
            <div
              className="courses"
              ref={el => scrollRefs.current[category.name] = el}
            >
              {category.courses.map(course => (
                <div
                  key={course.id}
                  className="course-card"
                    onClick={() => navigate("/course", { state: { course } })}>
                  <div className="card-img-wrapper">
                    <img src={course.image} alt={course.title}/>
                  </div>
                  <div className="card-body">
                    <h3>{course.title}</h3>
                    <p className="expert">Expert : {course.expert}</p>
                    <div className="rating-row">
                      <span className="rating-num">{course.rating}</span>
                      {renderStars(course.rating)}
                      <span className="reviews">({course.reviews})</span>
                    </div>
                    <div className="price-row">
                      <span className="price">{course.price}</span>
                      {course.badge && (
                        <span className={`badge ${course.badge === "New" ? "badge-new" : "badge-top"}`}>
                          {course.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

    </div>

    {openPopup && <CreateBootcampPopup close={()=>setOpenPopup(false)}/>}
  </div>
);
}

export default Bootcamp;