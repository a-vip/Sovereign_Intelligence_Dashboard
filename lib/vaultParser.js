import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const VAULT_PATH = path.resolve('c:/AI_Workspace/Obsidian/Avi');

// Directories to skip
const SKIP_DIRS = new Set(['.obsidian', 'sovereign-dashboard', 'node_modules', '.next']);

// Directory classification map
const CATEGORY_MAP = {
  'Automated_Intel_Dossiers': { label: 'Corporate Intel Dossiers', color: '#00f0ff', icon: 'building' },
  'LAWS_Archive': { label: 'LAWS Archive', color: '#ff2d55', icon: 'crosshair' },
  'State_Violations_Tracker': { label: 'State Violations', color: '#ff6b35', icon: 'alert-triangle' },
  'International_Law': { label: 'International Law', color: '#a855f7', icon: 'scale' },
  'Legal_Precedents_and_Caselaw': { label: 'Legal Precedents', color: '#facc15', icon: 'gavel' },
  'Advocacy_Outbound': { label: 'Advocacy & Outreach', color: '#22c55e', icon: 'megaphone' },
  '_root': { label: 'Command Hub', color: '#38bdf8', icon: 'compass' },
};

function getAllMarkdownFiles(dirPath, relativeTo = VAULT_PATH) {
  let files = [];
  
  if (!fs.existsSync(dirPath)) return files;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files = files.concat(getAllMarkdownFiles(fullPath, relativeTo));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
      const relativePath = path.relative(relativeTo, fullPath);
      const category = getCategory(relativePath);
      
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);
        
        // Extract title from first heading or filename
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch 
          ? titleMatch[1].replace(/[🛡️👁️📜🏛️🚀🌐⚖️🏢🚨]/g, '').trim()
          : entry.name.replace(/\.md$|\.markdown$/, '').replace(/_/g, ' ');
        
        // Extract all tags from frontmatter and inline
        const fmTags = Array.isArray(frontmatter.tags) 
          ? frontmatter.tags 
          : typeof frontmatter.tags === 'string'
            ? frontmatter.tags.split(',').map(t => t.trim())
            : [];
        
        // Extract inline tags (#Tag)
        const inlineTags = [...content.matchAll(/#([A-Za-z_][A-Za-z0-9_]*)/g)]
          .map(m => m[1])
          .filter(t => !['', 'Technical', 'Hardware', 'Software'].includes(t));
        
        const allTags = [...new Set([...fmTags, ...inlineTags])];
        
        // Extract wiki-links [[Target]]
        const wikiLinks = [...content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)]
          .map(m => m[1]);
        
        // Extract status
        const status = frontmatter.status || frontmatter.article_36_status || null;
        
        // Compute content stats
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const hasEvidence = /source|evidence|documented|verified|confirmed/i.test(content);
        const hasTables = content.includes('| :---');
        
        // Threat level heuristic
        let threatLevel = 'low';
        if (/active|operational|deployed|confirmed/i.test(content)) threatLevel = 'high';
        else if (/development|testing|proposed/i.test(content)) threatLevel = 'medium';
        if (frontmatter.status === 'Active Arrest Warrants') threatLevel = 'critical';
        if (/war.?crime|genocide|violation|breach/i.test(content)) threatLevel = 'critical';
        
        files.push({
          id: relativePath.replace(/[\\/]/g, '__').replace(/\.md$|\.markdown$/, ''),
          filename: entry.name,
          relativePath,
          category,
          categoryInfo: CATEGORY_MAP[category] || CATEGORY_MAP['_root'],
          title,
          frontmatter,
          tags: allTags,
          wikiLinks: [...new Set(wikiLinks)],
          status,
          threatLevel,
          wordCount,
          hasEvidence,
          hasTables,
          // Content preview (first 500 chars after frontmatter)
          preview: content
            .replace(/^#.+$/gm, '')
            .replace(/\[.*?\]\(.*?\)/g, '')
            .replace(/[#*_\-|>]/g, '')
            .trim()
            .slice(0, 500),
          // Full content for search
          content,
          lastModified: fs.statSync(fullPath).mtime.toISOString(),
          fileSize: fs.statSync(fullPath).size,
        });
      } catch (err) {
        console.error(`Error parsing ${fullPath}:`, err.message);
      }
    }
  }
  
  return files;
}

function getCategory(relativePath) {
  const parts = relativePath.split(path.sep);
  if (parts.length > 1) {
    // Check nested directories
    const topDir = parts[0];
    if (CATEGORY_MAP[topDir]) return topDir;
    return topDir;
  }
  return '_root';
}

export function parseVault() {
  const files = getAllMarkdownFiles(VAULT_PATH);
  
  // Aggregate metrics
  const totalDocuments = files.length;
  
  // Category distribution
  const categoryDistribution = {};
  for (const file of files) {
    const cat = file.categoryInfo?.label || file.category;
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
  }
  
  // Tag frequency
  const tagFrequency = {};
  for (const file of files) {
    for (const tag of file.tags) {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    }
  }
  
  // Threat level distribution
  const threatDistribution = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const file of files) {
    threatDistribution[file.threatLevel]++;
  }
  
  // Country distribution (from frontmatter)
  const countryDistribution = {};
  for (const file of files) {
    const country = file.frontmatter?.country || file.frontmatter?.state_actor;
    if (country) {
      countryDistribution[country] = (countryDistribution[country] || 0) + 1;
    }
  }
  
  // System types (from LAWS archive)
  const systemTypes = {};
  for (const file of files) {
    const sysType = file.frontmatter?.system_type;
    if (sysType) {
      systemTypes[sysType] = (systemTypes[sysType] || 0) + 1;
    }
  }
  
  // Producer distribution
  const producers = {};
  for (const file of files) {
    const producer = file.frontmatter?.producer;
    if (producer) {
      producers[producer] = (producers[producer] || 0) + 1;
    }
  }
  
  // Recent files (last 10 modified)
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
    .slice(0, 10);
  
  // Total word count
  const totalWords = files.reduce((sum, f) => sum + f.wordCount, 0);
  
  // Files with evidence
  const evidenceCount = files.filter(f => f.hasEvidence).length;
  
  // Unique entities tracked
  const entities = new Set();
  for (const file of files) {
    if (file.frontmatter?.producer) entities.add(file.frontmatter.producer);
    if (file.frontmatter?.state_actor) entities.add(file.frontmatter.state_actor);
  }
  
  // Build network graph data (connections between documents via wikilinks)
  const networkNodes = files.map(f => ({
    id: f.id,
    title: f.title,
    category: f.categoryInfo?.label || f.category,
    color: f.categoryInfo?.color || '#666',
    threatLevel: f.threatLevel,
    linkCount: f.wikiLinks.length,
  }));
  
  const networkEdges = [];
  for (const file of files) {
    for (const link of file.wikiLinks) {
      const target = files.find(f => 
        f.filename.replace(/\.md$/, '').replace(/_/g, ' ').toLowerCase() === link.replace(/_/g, ' ').toLowerCase()
        || f.title.toLowerCase() === link.replace(/_/g, ' ').toLowerCase()
      );
      if (target) {
        networkEdges.push({ source: file.id, target: target.id });
      }
    }
  }
  
  // Timeline data (by pulled date or last modified)
  const timelineData = files
    .filter(f => f.frontmatter?.pulled || f.lastModified)
    .map(f => ({
      date: f.frontmatter?.pulled || f.lastModified.split('T')[0],
      title: f.title,
      category: f.categoryInfo?.label || f.category,
      threatLevel: f.threatLevel,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    metrics: {
      totalDocuments,
      totalWords,
      evidenceCount,
      uniqueEntities: entities.size,
      categoriesTracked: Object.keys(categoryDistribution).length,
      criticalThreats: threatDistribution.critical,
      highThreats: threatDistribution.high,
      totalTags: Object.keys(tagFrequency).length,
      totalConnections: networkEdges.length,
    },
    distributions: {
      categories: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value })),
      tags: Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([name, value]) => ({ name, value })),
      threats: Object.entries(threatDistribution).map(([name, value]) => ({ name, value })),
      countries: Object.entries(countryDistribution)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value })),
      systemTypes: Object.entries(systemTypes)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value })),
      producers: Object.entries(producers)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value })),
    },
    documents: files.map(f => ({
      id: f.id,
      title: f.title,
      filename: f.filename,
      relativePath: f.relativePath,
      category: f.category,
      categoryLabel: f.categoryInfo?.label || f.category,
      categoryColor: f.categoryInfo?.color || '#666',
      tags: f.tags,
      status: f.status,
      threatLevel: f.threatLevel,
      wordCount: f.wordCount,
      hasEvidence: f.hasEvidence,
      preview: f.preview,
      content: f.content,
      frontmatter: f.frontmatter,
      wikiLinks: f.wikiLinks,
      lastModified: f.lastModified,
      fileSize: f.fileSize,
    })),
    recentFiles: recentFiles.map(f => ({
      id: f.id,
      title: f.title,
      category: f.categoryInfo?.label || f.category,
      color: f.categoryInfo?.color || '#666',
      threatLevel: f.threatLevel,
      lastModified: f.lastModified,
    })),
    network: { nodes: networkNodes, edges: networkEdges },
    timeline: timelineData,
    lastUpdated: new Date().toISOString(),
  };
}
