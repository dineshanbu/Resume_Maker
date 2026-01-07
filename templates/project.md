Recreate the EXACT resume design shown in the uploaded image using ONLY HTML and CSS.

IMPORTANT:
- The IMAGE is the single source of truth.
- Match layout, spacing, alignment, typography hierarchy, and section structure as closely as possible.
- Do NOT redesign.
- Do NOT change layout logic.
- Do NOT improvise visually.

Use the following strict rules:

1) HTML must use ONLY Handlebars placeholders.
2) Use EXACT placeholder names provided below.
3) NO hardcoded text or sample data inside HTML.
4) CSS must be in a separate block.
5) NO JavaScript.
6) A4 print optimized.
7) ATS-friendly semantic HTML.
8) Mobile responsive.

---------------------------------
PLACEHOLDER RULES (MANDATORY)
---------------------------------

Use ONLY these placeholders. Do NOT invent new ones.

Personal Info:
{{personalInfo.fullName}}
{{personalInfo.jobTitle}}
{{personalInfo.email}}
{{personalInfo.phone}}
{{personalInfo.location}}
{{personalInfo.linkedin}}
{{personalInfo.portfolio}}

Summary:
{{summary}}

Experience:
{{#each experience}}
  {{role}}
  {{company}}
  {{location}}
  {{duration}}
  {{#each responsibilities}}
    {{this}}
  {{/each}}
{{/each}}

Skills:
{{#each skills}}
  {{category}}
  {{#each items}}
    {{this}}
  {{/each}}
{{/each}}

Education:
{{#each education}}
  {{degree}}
  {{institution}}
  {{location}}
  {{year}}
  {{gpa}}
  {{#each honors}}
    {{this}}
  {{/each}}
{{/each}}

Projects:
{{#each projects}}
  {{name}}
  {{description}}
  {{link}}
  {{#each technologies}}
    {{this}}
  {{/each}}
  {{#each achievements}}
    {{this}}
  {{/each}}
{{/each}}

Certifications:
{{#if certifications}}
  {{#each certifications}}
    {{name}}
    {{issuer}}
    {{date}}
  {{/each}}
{{/if}}

Languages:
{{#if languages}}
  {{#each languages}}
    {{name}}
    {{proficiency}}
    {{proficiencyPercent}}
  {{/each}}
{{/if}}

Achievements:
{{#if achievements}}
  {{#each achievements}}
    {{this}}
  {{/each}}
{{/if}}

Interests:
{{#if interests}}
  {{#each interests}}
    {{name}}
    {{icon}}
  {{/each}}
{{/if}}

---------------------------------
OUTPUT FORMAT (STRICT)
---------------------------------

Return ONLY:

Block 1: HTML (placeholders only)
Block 2: CSS

NO explanations.
NO sample data.
NO markdown text outside code blocks.
