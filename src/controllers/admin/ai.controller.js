const asyncHandler = require('../../utils/asyncHandler');
const {
    successResponse,
    badRequestResponse,
    serverErrorResponse
} = require('../../utils/apiResponse');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * @desc    Generate a section layout using Google Gemini AI
 * @route   POST /api/v1/admin/ai/generate-layout
 * @access  Private (Admin only)
 */
const generateLayout = asyncHandler(async (req, res) => {
    const { section, prompt } = req.body;

    if (!section) {
        return badRequestResponse(res, 'Section type is required');
    }
    if (!prompt) {
        return badRequestResponse(res, 'Prompt is required');
    }

    if (!GEMINI_API_KEY) {
        return serverErrorResponse(res, 'Gemini API key is not configured. Add GEMINI_API_KEY to .env');
    }

    const systemPrompt = `You are a professional resume template designer. Generate ONLY HTML and CSS code for a resume section layout.

RULES:
1. Return ONLY valid HTML and CSS code. No markdown, no explanations.
2. The HTML should use placeholder variables in double curly braces like {{name}}, {{email}}, {{skills}}, etc.
3. The CSS should be scoped - prefix all selectors with a unique class like .sl-${section}-{random}.
4. Design must be responsive and visually professional for A4 resume pages.
5. Use modern CSS features like flexbox, grid, gradients, and subtle animations.
6. For list-type sections (skills, interests, languages), use {{#each items}}...{{/each}} pattern.
7. Keep the HTML compact and well-structured.
8. Return the result in this exact JSON format:
{
  "html": "<div class='sl-section-xxx'>...</div>",
  "css": ".sl-section-xxx { ... }"
}

Section Type: ${section}
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nUser Request: ${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', errorData);
            return serverErrorResponse(res, 'Failed to generate layout from AI');
        }

        const data = await response.json();

        // Extract text from Gemini response
        const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
            return serverErrorResponse(res, 'No content received from AI');
        }

        // Parse the JSON response
        let parsed;
        try {
            // Try direct JSON parse first
            parsed = JSON.parse(textContent);
        } catch (e) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = textContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[1]);
            } else {
                // Try to find JSON object in the text
                const objMatch = textContent.match(/\{[\s\S]*\}/);
                if (objMatch) {
                    parsed = JSON.parse(objMatch[0]);
                } else {
                    return serverErrorResponse(res, 'Could not parse AI response');
                }
            }
        }

        const result = {
            html: parsed.html || '',
            css: parsed.css || '',
            section: section,
            prompt: prompt
        };

        return successResponse(res, result, 'Layout generated successfully');

    } catch (error) {
        console.error('AI Layout Generation Error:', error);
        return serverErrorResponse(res, 'Failed to generate layout: ' + error.message);
    }
});

module.exports = {
    generateLayout
};
