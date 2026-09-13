'use client';
import { useState } from 'react';
import { X, BookOpen, ExternalLink, Plus, Check, Send, Search, Shield, Database, FileText } from 'lucide-react';

const CURATED_REPOSITORIES = [
  {
    name: 'SIPRI Arms & Military Technology Database',
    url: 'https://www.sipri.org/databases',
    category: 'Military AI & Arms',
    description: 'Independent resource tracking international arms transfers, military expenditure, and emerging military artificial intelligence systems.',
    tag: 'VERIFIED'
  },
  {
    name: 'Stop Killer Robots Campaign Documentation',
    url: 'https://www.stopkillerrobots.org/resources/',
    category: 'LAWS Treaties',
    description: 'Global coalition of 250+ NGOs working to establish international legal frameworks prohibiting autonomous weapons systems.',
    tag: 'CIVIL SOCIETY'
  },
  {
    name: 'UNIDIR AI & Autonomous Weapons Portal',
    url: 'https://unidir.org/topics/artificial-intelligence-and-autonomy/',
    category: 'Multilateral Treaties',
    description: 'United Nations Institute for Disarmament Research technical papers and legal analysis on military AI applications.',
    tag: 'UN AGENCY'
  },
  {
    name: 'Amnesty International Security Lab',
    url: 'https://www.amnesty.org/en/tech/',
    category: 'Surveillance Tech',
    description: 'Technical investigations exposing commercial spyware (Pegasus, Predator) and facial recognition apartheid deployment.',
    tag: 'FORENSICS'
  },
  {
    name: 'Citizen Lab Research Archive',
    url: 'https://citizenlab.ca/category/research/',
    category: 'Cyber & Surveillance',
    description: 'University of Toronto interdisciplinary laboratory monitoring digital espionage, targeted surveillance, and biometric controls.',
    tag: 'ACADEMIC'
  },
  {
    name: 'Bellingcat Open Source Investigations',
    url: 'https://www.bellingcat.com/',
    category: 'OSINT Conflict',
    description: 'Pioneering open source investigative collective documenting state violations and weaponized automated systems.',
    tag: 'OSINT'
  },
  {
    name: 'Airwars Civilian Harm Registry',
    url: 'https://airwars.org/',
    category: 'Conflict Documentation',
    description: 'Monitors, assesses, and archives civilian casualties resulting from explosive weapons and drone strikes globally.',
    tag: 'ACCOUNTABILITY'
  },
  {
    name: 'Tech Inquiry Procurement Explorer',
    url: 'https://techinquiry.org/',
    category: 'Corporate Complicity',
    description: 'Exposes surveillance and defense contracts between Big Tech corporations, intelligence agencies, and border forces.',
    tag: 'CONTRACT TRACKING'
  }
];

export default function ResourcesModal({ onClose, currentUser }) {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'submit', 'cite'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Submit form state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Military AI');
  const [description, setDescription] = useState('');
  const [submitterName, setSubmitterName] = useState(currentUser?.fullName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const categories = ['ALL', 'Military AI & Arms', 'LAWS Treaties', 'Surveillance Tech', 'Cyber & Surveillance', 'OSINT Conflict', 'Corporate Complicity'];

  const filteredRepositories = CURATED_REPOSITORIES.filter(repo => {
    const matchesCat = selectedCategory === 'ALL' || repo.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      repo.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSubmitResource = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setSubmitError('Title and URL are required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'resource',
          subject: `[Resource Contribution] ${title.trim()}`,
          details: `URL: ${url.trim()}\nCategory: ${category}\nDescription: ${description.trim()}\nContributor: ${submitterName || 'Anonymous Operator'}`,
          operatorName: submitterName || 'Anonymous Operator',
          operatorEmail: currentUser?.email || 'contributor@sovdash.com'
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTitle('');
        setUrl('');
        setDescription('');
      } else {
        setSubmitError('Failed to record resource. Please retry.');
      }
    } catch (err) {
      setSubmitError('Network error while saving resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.82)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 35px rgba(0, 240, 255, 0.15)',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} style={{ color: '#00f0ff' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#f8fafc', fontFamily: 'monospace' }}>
                INTELLIGENCE RESOURCES & REFERENCES VAULT
              </div>
              <div style={{ fontSize: '9px', color: '#94a3b8', letterSpacing: '0.02em' }}>
                VERIFIED ARCHIVES, LAWS PROTOCOLS & PUBLIC CONTRIBUTIONS
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8, 12, 22, 0.9)'
        }}>
          <button
            onClick={() => setActiveTab('directory')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'directory' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'directory' ? '2px solid #00f0ff' : '2px solid transparent',
              color: activeTab === 'directory' ? '#00f0ff' : '#94a3b8',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.05em'
            }}
          >
            📚 VERIFIED REPOSITORIES
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'submit' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'submit' ? '2px solid #00f0ff' : '2px solid transparent',
              color: activeTab === 'submit' ? '#00f0ff' : '#94a3b8',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.05em'
            }}
          >
            ➕ CONTRIBUTE REFERENCE
          </button>
          <button
            onClick={() => setActiveTab('cite')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'cite' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'cite' ? '2px solid #00f0ff' : '2px solid transparent',
              color: activeTab === 'cite' ? '#00f0ff' : '#94a3b8',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.05em'
            }}
          >
            📋 CITATIONS & DATA
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'directory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Search & Filter Controls */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{
                  position: 'relative',
                  flex: 1
                }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search verified registries, NGOs & databases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      borderRadius: '3px',
                      border: selectedCategory === cat ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: selectedCategory === cat ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: selectedCategory === cat ? '#00f0ff' : '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Repositories List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredRepositories.map((repo, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f8fafc' }}>
                          {repo.name}
                        </span>
                        <span style={{
                          fontSize: '8px',
                          fontFamily: 'monospace',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: 'rgba(0, 240, 255, 0.12)',
                          color: '#00f0ff',
                          border: '1px solid rgba(0, 240, 255, 0.25)',
                          fontWeight: 'bold'
                        }}>
                          {repo.tag}
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.45', marginBottom: '6px' }}>
                        {repo.description}
                      </div>
                      <span style={{ fontSize: '8.5px', fontFamily: 'monospace', color: '#64748b' }}>
                        CATEGORY: {repo.category}
                      </span>
                    </div>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: '4px',
                        color: '#00f0ff',
                        padding: '6px 10px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.25)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)'}
                    >
                      <span>VISIT</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'submit' && (
            <form onSubmit={handleSubmitResource} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
                Submit research whitepapers, investigative news links, NGO legal reports, or verified datasets to expand Sovereign Intelligence coverage.
              </div>

              {submitSuccess && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid #22c55e',
                  borderRadius: '4px',
                  color: '#22c55e',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Check size={14} />
                  <span>REFERENCE SUBMITTED SUCCESSFULLY TO SOVEREIGN INTELLIGENCE VAULT!</span>
                </div>
              )}

              {submitError && (
                <div style={{
                  padding: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  color: '#ef4444',
                  fontSize: '11px'
                }}>
                  {submitError}
                </div>
              )}

              <div>
                <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  DOCUMENT / REPORT TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UN OCHA Situation Report on Gaza Autonomous Targeting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  SOURCE URL / DOI LINK *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#38bdf8',
                    fontSize: '11px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Military AI">Military AI & Automated Warfare</option>
                    <option value="Autonomous Weapons">Lethal Autonomous Weapons (LAWS)</option>
                    <option value="Biometric Surveillance">Biometric & Facial Surveillance</option>
                    <option value="Corporate Complicity">Corporate / Defense Tech Procurement</option>
                    <option value="Conflict Documentation">Active Conflict Verification</option>
                    <option value="International Law">International Humanitarian Law</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    SUBMITTER HANDLE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Researcher_04"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  KEY FINDINGS / EXCERPT
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide a brief summary, quote, or specific paragraph detailing the technology or violation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 16px',
                  background: isSubmitting ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 240, 255, 0.25)',
                  border: '1px solid #00f0ff',
                  borderRadius: '4px',
                  color: '#00f0ff',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)'
                }}
              >
                <Send size={12} />
                <span>{isSubmitting ? 'ENCRYPTING & TRANSMITTING...' : 'SUBMIT INTEL REFERENCE'}</span>
              </button>
            </form>
          )}

          {activeTab === 'cite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Use the following citation formats when referencing the Sovereign Intelligence tracking telemetry in academic papers or policy briefings:
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#00f0ff', marginBottom: '6px' }}>
                  BIBTEX CITATION:
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '9.5px',
                  fontFamily: 'monospace',
                  color: '#cbd5e1',
                  overflowX: 'auto',
                  lineHeight: '1.5'
                }}>
{`@misc{sovereign_intelligence_2026,
  author = {Sovereign Intelligence Unit},
  title = {Sovereign Intelligence Dashboard: Global Autonomous Weapons and State Accountability Radar},
  year = {2026},
  url = {https://app.sovdash.com/},
  note = {Accessed: September 2026}
}`}
                </pre>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#00f0ff', marginBottom: '6px' }}>
                  APA CITATION:
                </div>
                <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Sovereign Intelligence Unit. (2026). <em>Sovereign Intelligence Dashboard: Global Autonomous Weapons and State Accountability Radar</em>. https://app.sovdash.com/
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
