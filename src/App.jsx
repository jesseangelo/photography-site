import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom'
import { loadProjects } from './lib/projects'
import site from './data/site.json'
import Home from './pages/Home'
import ProjectPage from './pages/ProjectPage'
import Books from './pages/Books'
import About from './pages/About'
import Admin from './pages/Admin'

export const ProjectsContext = createContext({ projects: [], loading: true, error: null })
export const useProjects = () => useContext(ProjectsContext)
export const emailAddress = () => site.emailParts.join('@')

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="brand">
          <img src="/brand/ja-logo.png" alt="" className="brand-logo" />
          <span className="brand-name">Jesse Angelo</span>
        </Link>
        <nav className="site-nav">
          <NavLink to="/" end>Projects</NavLink>
          <NavLink to="/books">Books</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/:slug" element={<ProjectPage />} />
          <Route path="/books" element={<Books />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Jesse Angelo</span>
        <a href={`mailto:${emailAddress()}`}>{emailAddress()}</a>
      </footer>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState({ projects: [], loading: true, error: null })
  useEffect(() => {
    loadProjects()
      .then(projects => setState({ projects, loading: false, error: null }))
      .catch(err => setState({ projects: [], loading: false, error: String(err) }))
  }, [])
  return (
    <ProjectsContext.Provider value={state}>
      <BrowserRouter>
        <ScrollToTop />
        <Layout />
      </BrowserRouter>
    </ProjectsContext.Provider>
  )
}
