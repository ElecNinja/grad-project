import React, { useState } from "react";
import "./CreateBootcampPopup.css";

function CreateBootcampPopup({close}){

const [titleCount, setTitleCount] = useState(0);
const [descCount, setDescCount] = useState(0);

return(
  <div className="overlay">
    <div className="popup">

      <h2>Create Bootcamp</h2>

      <label>Title <span className="required">*</span></label>
      <div className="input-wrapper">
        <input 
          type="text" 
          placeholder="Advanced Algebra" 
          maxLength={100}
          onChange={(e) => setTitleCount(e.target.value.length)}
        />
        <span className="char-count">{titleCount}/100</span>
      </div>

      <label>Description <span className="info">ⓘ</span></label>
      <div className="input-wrapper">
        <textarea 
          placeholder="Tell students about your intro video"
          maxLength={500}
          onChange={(e) => setDescCount(e.target.value.length)}
        />
        <span className="char-count textarea-count">{descCount}/500</span>
      </div>

      <label>Number of Students</label>
      <input type="number" placeholder="2" className="small-input"/>

      <div className="date-row">
        <div className="date-field">
          <label>From</label>
          <input type="date" defaultValue="2026-11-28"/>
        </div>
        <div className="date-field">
          <label>To</label>
          <input type="date" defaultValue="2026-11-28"/>
        </div>
      </div>

      <div className="buttons">
        <button className="undo-btn" onClick={close}>Undo</button>
        <button className="save">Save</button>
      </div>

    </div>
  </div>
)
}

export default CreateBootcampPopup;