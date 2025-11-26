"""
AI prompt templates for activity generation
"""

CUSTOMIZATION_PROMPT = """You are an expert team-building facilitator. Customize the following team-building activity to be more relevant and engaging for this specific team.

**Original Activity:**
- Title: {activity_title}
- Category: {activity_category}
- Description: {activity_description}
- Instructions: {activity_instructions}

**Team Context:**
- Team Role: {team_role}
- Member Responsibilities: {responsibilities}
- Past Activities: {past_activities}
- Industry Sector: {sector}
- Target Duration: {duration} minutes

**Your Task:**
Adapt this activity to fit the team's context, ensuring it:
1. Aligns with their work responsibilities and sector
2. Fits within the {duration}-minute timeframe
3. Uses relevant examples and scenarios from their industry
4. Maintains the core benefits of the original activity

**Output Format (JSON):**
{{
  "title": "Customized activity title",
  "description": "Brief description explaining the customization",
  "category": "Same category as original",
  "duration_minutes": {duration},
  "complexity": "easy|medium|hard",
  "required_tools": ["tool1", "tool2"],
  "instructions": "Step-by-step instructions adapted for this team",
  "customization_notes": "What was changed and why"
}}

Respond ONLY with valid JSON, no additional text."""


CUSTOM_GENERATION_PROMPT = """You are an expert team-building activity designer. Create a unique, engaging team-building activity for this specific team.

**Activity #{activity_number} of 3** (Make each unique)

**Team Context:**
- Team Role: {team_role}
- Member Responsibilities: {responsibilities}
- Uploaded Materials Summary: {materials_summary}
- Additional Requirements: {requirements}

**Previous Activities Generated:** {previous_titles}
(Make sure this activity is different from the above)

**Your Task:**
Design a completely original team-building activity that:
1. Is specifically tailored to this team's work and responsibilities
2. Incorporates relevant concepts from their uploaded materials
3. Takes 30-45 minutes to complete
4. Promotes collaboration, communication, or problem-solving
5. Is practical for remote/hybrid teams
6. Is different from any previously generated activities

**Output Format (JSON):**
{{
  "title": "Creative activity title",
  "description": "Engaging description that explains the value",
  "category": "communication|collaboration|problem_solving|creativity|trust_building",
  "duration_minutes": 30-45,
  "complexity": "easy|medium|hard",
  "required_tools": ["tool1", "tool2"],
  "instructions": "Detailed step-by-step instructions",
  "customization_notes": "Why this activity is perfect for this team"
}}

Respond ONLY with valid JSON, no additional text."""


SUMMARIZATION_PROMPT = """Summarize the following content in {max_length} characters or less, focusing on key points relevant to team-building activities:

{text}

Summary:"""
