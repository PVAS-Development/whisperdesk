import { useState, useEffect, useRef, useMemo } from 'react'
import './OutputDisplay.css'

const OUTPUT_FORMATS = [
  { value: 'vtt', label: 'VTT Subtitles', ext: '.vtt' },
  { value: 'srt', label: 'SRT Subtitles', ext: '.srt' },
  { value: 'txt', label: 'Plain Text', ext: '.txt' },
]

function OutputDisplay({ text, onSave, onCopy, copySuccess }) {
  const [showSaveMenu, setShowSaveMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const saveMenuRef = useRef(null)
  const searchInputRef = useRef(null)
  const contentRef = useRef(null)
  const hasText = text && text.length > 0
  const wordCount = hasText ? text.trim().split(/\s+/).length : 0
  const charCount = hasText ? text.length : 0

  // Calculate matches
  const matches = useMemo(() => {
    if (!searchQuery || !text) return []
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const results = []
    let match
    while ((match = regex.exec(text)) !== null) {
      results.push({ start: match.index, end: match.index + match[0].length })
    }
    return results
  }, [searchQuery, text])

  // Reset match index when query changes
  useEffect(() => {
    setCurrentMatchIndex(0)
  }, [searchQuery])

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Keyboard shortcut for search (Cmd/Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && hasText) {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setSearchQuery('')
      }
      // Navigate between matches with Enter/Shift+Enter
      if (e.key === 'Enter' && showSearch && matches.length > 0) {
        e.preventDefault()
        if (e.shiftKey) {
          setCurrentMatchIndex(prev => prev <= 0 ? matches.length - 1 : prev - 1)
        } else {
          setCurrentMatchIndex(prev => prev >= matches.length - 1 ? 0 : prev + 1)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasText, showSearch, matches.length])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target)) {
        setShowSaveMenu(false)
      }
    }
    if (showSaveMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSaveMenu])

  const handleSaveFormat = (format) => {
    setShowSaveMenu(false)
    onSave(format)
  }

  // Highlight text with search matches
  const highlightedText = useMemo(() => {
    if (!searchQuery || !text || matches.length === 0) return null
    
    const parts = []
    let lastIndex = 0
    
    matches.forEach((match, index) => {
      // Add text before match
      if (match.start > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.start)}
          </span>
        )
      }
      // Add highlighted match
      parts.push(
        <mark 
          key={`match-${index}`}
          className={`search-highlight ${index === currentMatchIndex ? 'current' : ''}`}
          data-match-index={index}
        >
          {text.substring(match.start, match.end)}
        </mark>
      )
      lastIndex = match.end
    })
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      )
    }
    
    return parts
  }, [text, searchQuery, matches, currentMatchIndex])

  // Scroll to current match
  useEffect(() => {
    if (matches.length > 0 && contentRef.current) {
      const currentMark = contentRef.current.querySelector('.search-highlight.current')
      if (currentMark) {
        currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentMatchIndex, matches.length])

  return (
    <div className="output-container">
      <div className="output-header">
        <h3>Transcription</h3>
        <div className="output-meta">
          {hasText && (
            <span className="word-count">
              {wordCount} words · {charCount} chars
            </span>
          )}
        </div>
        {hasText && (
          <div className="output-actions">
            <button 
              className={`btn-icon ${showSearch ? 'active' : ''}`}
              onClick={() => {
                setShowSearch(!showSearch)
                if (showSearch) setSearchQuery('')
              }}
              title="Search transcript (⌘F)"
              aria-label="Search transcript"
            >
              🔍 Search
            </button>
            <button 
              className={`btn-icon ${copySuccess ? 'success' : ''}`} 
              onClick={onCopy} 
              title="Copy to clipboard"
              aria-label="Copy transcription to clipboard"
            >
              {copySuccess ? '✓ Copied!' : '📋 Copy'}
            </button>
            <div className="save-dropdown" ref={saveMenuRef}>
              <button 
                className="btn-icon" 
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                title="Save to file"
                aria-label="Save transcription to file"
                aria-expanded={showSaveMenu}
              >
                💾 Save
              </button>
              {showSaveMenu && (
                <div className="save-menu">
                  {OUTPUT_FORMATS.map(format => (
                    <button
                      key={format.value}
                      className="save-menu-item"
                      onClick={() => handleSaveFormat(format.value)}
                    >
                      {format.label} <span className="format-ext">{format.ext}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {showSearch && hasText && (
        <div className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search transcript"
          />
          <div className="search-nav">
            {searchQuery && (
              <span className="search-count">
                {matches.length > 0 
                  ? `${currentMatchIndex + 1} of ${matches.length}`
                  : 'No matches'
                }
              </span>
            )}
            <button 
              className="search-nav-btn"
              onClick={() => setCurrentMatchIndex(prev => prev <= 0 ? matches.length - 1 : prev - 1)}
              disabled={matches.length === 0}
              title="Previous match (Shift+Enter)"
              aria-label="Previous match"
            >
              ↑
            </button>
            <button 
              className="search-nav-btn"
              onClick={() => setCurrentMatchIndex(prev => prev >= matches.length - 1 ? 0 : prev + 1)}
              disabled={matches.length === 0}
              title="Next match (Enter)"
              aria-label="Next match"
            >
              ↓
            </button>
            <button 
              className="search-nav-btn close"
              onClick={() => { setShowSearch(false); setSearchQuery('') }}
              title="Close search (Esc)"
              aria-label="Close search"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="output-content" ref={contentRef} role="region" aria-label="Transcription output">
        {hasText ? (
          <pre className="transcription-text" aria-label="Transcribed text">
            {highlightedText || text}
          </pre>
        ) : (
          <div className="output-placeholder" role="status" aria-live="polite">
            <span className="placeholder-icon">📝</span>
            <span>Transcription will appear here</span>
            <span className="placeholder-hint">Select a file and click Transcribe to start</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default OutputDisplay
