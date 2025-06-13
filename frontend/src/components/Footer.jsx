import '../styles/components/footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="social-links">
                    <a 
                        href="https://github.com/NikitaGhimire/messaging-app.git" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="social-link"
                    >
                        <i className="fab fa-github"></i>
                        GitHub
                    </a>
                    <a 
                        href="https://linkedin.com/in/nikita-ghimire-info" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="social-link"
                    >
                        <i className="fab fa-linkedin"></i>
                        LinkedIn
                    </a>
                </div>
                <div className="copyright">
                    <p>&copy; {new Date().getFullYear()} Nikita Ghimire. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;