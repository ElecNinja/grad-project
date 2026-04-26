import React, { useState } from 'react';
import './Videos.css';

const courses = [
  {
    id: 1,
    title: "Introduction to Cyber Security",
    expert: "Prof. Walter White",
    videos: "1/2",
    description: "This module covers the core concepts of information security, including the CIA triad, threat modeling, and basic encryption techniques.",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    type: "COURSE"
  },
  {
    id: 2,
    title: "Machine Learning Fundamentals",
    expert: "Prof. Mokter",
    date: "12/20 - 12/25",
    description: "Learn the fundamentals of machine learning including supervised, unsupervised learning and neural networks.",
    thumbnail: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    type: "COURSE"
  },
  {
    id: 3,
    title: "Network Architecture Advanced",
    expert: "Prof. Walter White",
    videos: "1/2",
    description: "Advanced concepts in network architecture, protocols, and security implementations.",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    type: "COURSE"
  },
];

const bootcamps = [
  {
    id: 4,
    title: "Full Stack Development",
    expert: "Bavly",
    progress: 65,
    description: "Complete full stack development bootcamp covering React, Node.js, and databases.",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    currentLesson: "Lesson 13: Introduction to React Hooks",
    type: "BOOTCAMP",
    syllabus: [
      { id: 1, title: "Setup Your Environment", duration: "24:10", done: true },
      { id: 2, title: "Introduction to React Hooks", duration: "14:22", done: false, current: true },
      { id: 3, title: "Advanced State Management with Redux", duration: "21:15", done: false },
      { id: 4, title: "Backend Integration: Express & Node.js", duration: "18:45", done: false },
    ]
  },
  {
    id: 5,
    title: "Advanced UI/UX Design",
    expert: "Gary Rehan",
    progress: 40,
    description: "Master UI/UX design principles and tools.",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    currentLesson: "Lesson 5: Color Theory",
    type: "BOOTCAMP",
    syllabus: [
      { id: 1, title: "Design Fundamentals", duration: "20:00", done: true },
      { id: 2, title: "Color Theory", duration: "15:30", done: false, current: true },
      { id: 3, title: "Typography", duration: "18:00", done: false },
    ]
  },
];

function Videos() {
  const [activeTab, setActiveTab] = useState('courses');
  const [selected, setSelected] = useState(courses[0]);
  const [playing, setPlaying] = useState(false);

  const currentList = activeTab === 'courses' ? courses : bootcamps;

  const handleSelect = (item) => {
    setSelected(item);
    setPlaying(false);
  };

  return (
    <div className="videos-page">

      {/* Tabs */}
      <div className="videos-tabs">
        <button
          className={`videos-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => { setActiveTab('courses'); setSelected(courses[0]); setPlaying(false); }}
        >
          Courses
        </button>
        <button
          className={`videos-tab ${activeTab === 'bootcamp' ? 'active' : ''}`}
          onClick={() => { setActiveTab('bootcamp'); setSelected(bootcamps[0]); setPlaying(false); }}
        >
          BootCamp
        </button>
      </div>

      <div className="videos-body">

        {/* Left */}
        <div className="videos-left">
          <h2 className="videos-select-title">
            <span className="videos-play-icon">▶</span>
            Select a Module
          </h2>

          <div className="videos-list">
            {currentList.map((item) => (
              <div
                key={item.id}
                className={`videos-item ${selected?.id === item.id ? 'active' : ''}`}
                onClick={() => handleSelect(item)}
              >
                <img src={item.thumbnail} alt={item.title} className="videos-item-thumbnail" />
                <div className="videos-item-content">
                  <span className="videos-item-badge">{item.type}</span>
                  <h3 className="videos-item-title">{item.title}</h3>
                  <div className="videos-item-meta">
                    <span>👤 {item.expert}</span>
                    {item.progress !== undefined && (
                      <>
                        <div className="videos-progress-bar">
                          <div className="videos-progress-fill" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="videos-progress-text">{item.progress}%</span>
                      </>
                    )}
                    {item.videos && <span>🎬 {item.videos}</span>}
                    {item.date && <span>📅 {item.date}</span>}
                  </div>
                </div>
                <div className={`videos-radio ${selected?.id === item.id ? 'selected' : ''}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        {selected && (
          <div className="videos-right">
            <div className="videos-preview">
              {playing ? (
                <video
                  src={selected.videoUrl}
                  controls
                  autoPlay
                  className="videos-player"
                />
              ) : (
                <div className="videos-thumbnail" onClick={() => setPlaying(true)}>
                  <img src={selected.thumbnail} alt={selected.title} />
                  <div className="videos-play-btn">▶</div>
                  {activeTab === 'bootcamp' && selected.currentLesson ? (
                    <div className="videos-current-lesson">
                      <h4>{selected.currentLesson}</h4>
                      <p>{selected.title}</p>
                    </div>
                  ) : (
                    <span className="videos-preview-label">PREVIEW</span>
                  )}
                </div>
              )}
            </div>

            <div className="videos-info">
              <h3>{selected.title}</h3>
              <p>{selected.description}</p>

              {activeTab === 'bootcamp' && selected.syllabus && (
                <div className="videos-syllabus">
                  <div className="videos-syllabus-header">
                    <span>Bootcamp Syllabus</span>
                    <span className="videos-syllabus-progress">
                      {selected.syllabus.filter(s => s.done).length} / {selected.syllabus.length} Completed
                    </span>
                  </div>
                  {selected.syllabus.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`videos-lesson ${lesson.current ? 'current' : ''} ${lesson.done ? 'done' : ''}`}
                    >
                      <span className="videos-lesson-icon">
                        {lesson.done ? '✅' : lesson.current ? '🔵' : '⭕'}
                      </span>
                      <span className="videos-lesson-title">{lesson.title}</span>
                      <span className="videos-lesson-duration">{lesson.duration}</span>
                    </div>
                  ))}
                </div>
              )}

              <button className="videos-start-btn" onClick={() => setPlaying(true)}>
                {activeTab === 'bootcamp' ? 'Continue Bootcamp →' : 'Start Course 🚀'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Videos;