const { askAI } = require('./aiClient');
const { execSync } = require('child_process');

async function generateCommitMessage() {
  try {
    const diff = execSync('git diff --cached').toString();
    
    if (!diff) {
      console.log('No staged changes found. Use "git add" to stage files.');
      return;
    }

    const systemPrompt = `You are a Git expert. Generate a concise, professional commit message in conventional commits format (e.g., feat: ..., fix: ...) based on the provided diff. Only return the message text.`;
    const prompt = `Diff of staged changes:\n\n${diff}`;

    const message = await askAI(prompt, systemPrompt);
    console.log('--- Suggested Commit Message ---');
    console.log(message.trim());
    console.log('--------------------------------');
  } catch (error) {
    console.error('Error generating commit message:', error.message);
  }
}

async function summarizeRecentChanges() {
  try {
    const history = execSync('git log --since="24 hours ago" -p').toString();
    
    if (!history) {
      console.log('No changes in the last 24 hours.');
      return;
    }

    const systemPrompt = `You are an Intelligence Analyst. Summarize the following code changes into a high-level "Daily Intelligence Brief". Focus on new features, security implications, and structural changes. Use bullet points.`;
    const prompt = `Git history for the last 24 hours:\n\n${history}`;

    const brief = await askAI(prompt, systemPrompt);
    console.log('### DAILY INTELLIGENCE BRIEF ###');
    console.log(brief);
  } catch (error) {
    console.error('Error generating daily brief:', error.message);
  }
}

const mode = process.argv[2];

if (mode === 'commit') {
  generateCommitMessage();
} else if (mode === 'brief') {
  summarizeRecentChanges();
} else {
  console.log('Usage: node gitAI.js [commit|brief]');
}
