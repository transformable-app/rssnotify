import React from 'react'
import './index.scss'

const BeforeLogin: React.FC = () => {
  return (
    <div className="before-login">
      <h2 className="before-login__brand">
        <span className="before-login__icon" aria-hidden="true">
          <svg fill="none" height="22" viewBox="0 0 24 24" width="22" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="19" fill="currentColor" r="2" />
            <path d="M4 11C8.41828 11 12 14.5817 12 19" stroke="currentColor" strokeWidth="2.4" />
            <path d="M4 4C12.2843 4 19 10.7157 19 19" stroke="currentColor" strokeWidth="2.4" />
          </svg>
        </span>
        <span>rssnotify</span>
      </h2>
      <p>
        <b>Welcome to rssnotify!</b>
      </p>
    </div>
  )
}

export default BeforeLogin
