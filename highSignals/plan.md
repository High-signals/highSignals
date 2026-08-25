# AI Feature Implementation Plan: Create Post

This document outlines the detailed UX flow, technical requirements, and state management for integrating the AI generation feature into the `create-post.tsx` page. This plan ensures a premium, non-intrusive, and highly interactive user experience.

## Overview
The goal is to allow users to generate or rewrite their scripts using AI. The AI context is powered by four key pieces of data:
1. The user's current script (draft)
2. The selected Content Type (e.g., Storytelling, Listicle)
3. The user's ICP (Ideal Customer Profile)
4. The user's Writing Style preferences

## 1. UI Flow & Interactions

### A. The Trigger (Sparkles Button)
- **Location:** The existing `✨ AI` button hovering near the formatting tools at the bottom of the editor.
- **Validation:** When pressed, check if the `contentType` state is set.
  - *If null:* Trigger a toast or inline warning: *"Please select a Content Type before running the AI."* (Optionally, automatically open the Content Type selector sheet).
  - *If set:* Dim the main editor and trigger a Bottom Sheet Modal (e.g., `@gorhom/bottom-sheet`).

### B. The "Thinking" State (Loading Screen)
- **Visuals:** Display a premium loading state inside the Bottom Sheet.
  - A subtle pulsing animation (brand logo or sparkles icon).
  - Dynamic status text that cycles every 1.5 seconds: *"Analyzing your style..."* ➔ *"Reviewing your ICP..."* ➔ *"Drafting your script..."*
- **UX Rule:** Do not block the main UI thread. Allow the user to swipe down the sheet to minimize it if they want to do other things while waiting. 

### C. The "Review & Tweak" Interface (The Magic Moment)
- **Display:** Once the backend returns the AI-generated text, the Bottom Sheet expands into a "Split View" or "Preview Card".
- **Components:**
  - **The Draft Container:** A `ScrollView` with a solid `surfaceCard` background displaying the newly generated text.
  - **The Tweak Bar (Prompt Input):** A text input fixed at the bottom of the card with placeholder text: *"Make it punchier", "Make it shorter", or "Sound more professional"*.
    - Sending a prompt here re-triggers the "Thinking" state and sends the *new prompt + previous AI response* back to the server for a revision.
  - **Action Buttons:**
    - `Discard` (Secondary outline button): Closes the sheet and trashes the AI draft.
    - `Replace Script` (Primary Action button - solid blue/gold): Replaces the main editor's content.
    - `Insert Below` (Optional Ghost button): Appends the AI text to the end of their existing draft.

### D. The Finish (Haptics)
- When the user selects `Replace Script` or `Insert Below`:
  - Trigger a success haptic feedback: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`.
  - Smoothly dismiss the Bottom Sheet.
  - Update the main editor's `content` state.

## 2. Technical Implementation Requirements

### API Payload Structure
When triggering the AI request, the frontend must package the following payload to the backend:
```json
{
  "current_script": "string",
  "content_type": "string (e.g., 'Storytelling')",
  "icp_profile_id": "uuid (reference to fetch ICP data)",
  "writing_style_id": "uuid (reference to fetch Style data)",
  "tweak_prompt": "string (optional, used during revisions)"
}
```

### State Management (`create-post.tsx`)
New states required for the component:
```typescript
const [isAISheetOpen, setIsAISheetOpen] = useState(false);
const [aiLoadingState, setAiLoadingState] = useState<'idle' | 'analyzing' | 'drafting'>('idle');
const [aiDraftContent, setAiDraftContent] = useState<string | null>(null);
const [tweakPrompt, setTweakPrompt] = useState('');
```

### Edge Cases to Handle
1. **Network Failure:** If the API fails, show a clean error state inside the sheet with a "Try Again" button. Do not crash the modal.
2. **Empty Script:** If the user presses the AI button on a completely blank canvas, the API payload should handle `current_script: ""` gracefully (e.g., generating from scratch based purely on Content Type and ICP).
3. **Keyboard Avoidance:** Ensure the "Tweak Bar" input does not get covered by the iOS/Android virtual keyboard when typing a revision prompt. Wrap the modal content in `KeyboardAvoidingView`.
