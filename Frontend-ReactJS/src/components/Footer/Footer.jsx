import { Link, NavLink } from 'react-router-dom';
import "./footer.css"

/**
 * Component returns footer component.
 * 
 * @returns {React.ReactElement}
 */
function Footer() {
  return (
    <footer className="Footer">
      <div className="Footer-Container">

        {/* Support Section */}
        <div className="Footer-Section">
          <h3 className="Footer-Title">Support</h3>
          <NavLink className="Footer-Text">Need any help?</NavLink>
        </div>

        {/* Contacts Section */}
        <div className="Footer-Section">
          <h3 className="Footer-Title">Contacts</h3>
          <div className="Footer-Contact">
            <p className="Footer-Text">Egypt</p>
            <p className="Footer-Text">13-15 Aziz Ezzat, Dame Al Gadidah WA Izzam A' Wastaniyah,</p>
            <p className="Footer-Text">El Ram 2, Alexandria Governorate 5443640</p>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="Footer-Section">
          <h3 className="Footer-Title">Social Media</h3>
          <div className="Footer-Social-List">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="Footer-Social-Link">
              Facebook
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="Footer-Social-Link">
              Instagram
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="Footer-Social-Link">
              Youtube
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="Footer-Social-Link">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;