// Fence from docs/corrections-log.md: the unslop rules were prose only.
// Fails when pull request text has dashes or words that .claude/skills/unslop/SKILL.md bans.
// Code blocks, inline code, HTML comments and links are skipped.

const text = process.env.PR_BODY ?? '';

const banned = [
  'additionally', 'crucial', 'delve', 'delves', 'delving', 'fostering', 'garner', 'interplay',
  'intricate', 'pivotal', 'showcase', 'showcases', 'tapestry', 'testament', 'vibrant',
  'utilize', 'utilise', 'leverage', 'leverages', 'leveraging', 'facilitate', 'numerous',
  'paradigm', 'seamless', 'seamlessly', 'robust', 'comprehensive',
];

const cleaned = text
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/```[\s\S]*?```/g, '')
  .replace(/`[^`\n]*`/g, '')
  .replace(/\]\([^)]*\)/g, ']')
  .replace(/https?:\/\/\S+/g, '');

const problems = [];
cleaned.split('\n').forEach((line, i) => {
  if (/[—–]/.test(line)) problems.push(`line ${i + 1}: em or en dash. End the sentence or use a comma.`);
  for (const word of banned) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(line)) problems.push(`line ${i + 1}: "${word}". Use a plain word.`);
  }
});

if (problems.length === 0) {
  console.log('Writing check passed.');
} else {
  for (const p of problems) console.log(`::error title=Writing check::${p}`);
  console.log(`${problems.length} problem(s). Rules: .claude/skills/unslop/SKILL.md`);
  process.exit(1);
}
