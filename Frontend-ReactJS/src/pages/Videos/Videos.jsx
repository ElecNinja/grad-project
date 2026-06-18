import React, { useState, useEffect } from 'react';
import './Videos.css';
import { getMyVideoCourses, getMyVideoBootcamps } from '../../apis/handlers/getStudentVideos';
import { getMyUploadedVideos } from '../../apis/handlers/getMyUploadedVideos';
function Videos() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [bootcamps, setBootcamps] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const [coursesData, bootcampsData, uploadedData] = await Promise.all([
          getMyVideoCourses(),
          getMyVideoBootcamps(),
          getMyUploadedVideos(),
        ]);

        if (!isMounted) return;

        setCourses(coursesData);
        setBootcamps(bootcampsData);
        setUploadedVideos(uploadedData);
        setSelected(coursesData[0] || uploadedData[0] || null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load videos:', err);
        setError('Failed to load your courses and bootcamps. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVideos();
    return () => { isMounted = false; };
  }, []);

  const getCurrentList = () => {
    if (activeTab === 'courses') return courses;
    if (activeTab === 'bootcamp') return bootcamps;
    return uploadedVideos;
  };

  const currentList = getCurrentList();

  const handleSelect = (item) => {
    setSelected(item);
    setPlaying(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const list = tab === 'courses' ? courses : tab === 'bootcamp' ? bootcamps : uploadedVideos;
    setSelected(list[0] || null);
    setPlaying(false);
  };

  if (loading) {
    return (
      <div className="videos-page">
        <p>Loading your videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="videos-page">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="videos-page">

      {/* Tabs */}
      <div className="videos-tabs">
        <button
          className={`videos-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => handleTabChange('courses')}
        >
          Courses
        </button>
        <button
          className={`videos-tab ${activeTab === 'bootcamp' ? 'active' : ''}`}
          onClick={() => handleTabChange('bootcamp')}
        >
          BootCamp
        </button>
        <button
          className={`videos-tab ${activeTab === 'uploaded' ? 'active' : ''}`}
          onClick={() => handleTabChange('uploaded')}
        >
          From My Teacher
        </button>
      </div>

      <div className="videos-body">

        {/* Left */}
        <div className="videos-left">
          <h2 className="videos-select-title">
            <span className="videos-play-icon">▶</span>
            Select a Module
          </h2>

          {currentList.length === 0 ? (
            <p className="videos-empty">
              {activeTab === 'courses' && "You're not enrolled in any courses yet."}
              {activeTab === 'bootcamp' && "You're not enrolled in any bootcamps yet."}
              {activeTab === 'uploaded' && "Your teacher hasn't uploaded any videos for you yet."}
            </p>
          ) : (
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
                      {item.progress !== undefined && item.progress !== null && (
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
          )}
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