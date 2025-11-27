# Implementation Plan - Legal App Enhancement & Deployment

This plan addresses the critical data display issues, implements advanced legal document generation (EEOC/TWC complaints, Discovery Requests), and ensures the project is correctly deployed to the `legal-case-builder-fresh26Nov` repository.

## User Objectives
1.  **Fix Data Issues:** Ensure all 160 questions are displayed and populated with answers parsed from the reference documents (aiming for 80-90% coverage).
2.  **Advanced Legal Features:**
    *   Draft formal demand letters for discovery.
    *   Draft EEOC and TWC complaints.
    *   Analyze gaps and timeline.
3.  **Repository Management:** Use `legal-case-builder-fresh26Nov` as the source of truth and archive obsolete files.
4.  **UI/UX:** "Best of the best law firm" quality - professional, functional, and complete.

## Proposed Changes

### 1. Data Parsing & Population (Critical)
-   **Goal:** Automatically populate the "Questions" tab with answers from `Complete-160-Questions-Answers.md`.
-   **Action:**
    *   Analyze `src/utils/parseReferenceData.ts` to see current parsing logic.
    *   Enhance parsing to map markdown sections/questions to the `LEGAL_QUESTIONS` IDs.
    *   Update `App.tsx` to state-manage the questions (instead of using the static `LEGAL_QUESTIONS` constant directly) so they can be updated with parsed answers.

### 2. Feature Integration
-   **Complaint Generator:**
    *   Integrate the newly created `ComplaintGenerator.tsx` into `App.tsx` (likely in the "Strategy" or "Conference" tab, or a new "Legal Actions" section).
-   **Discovery Request Generator:**
    *   Integrate `DiscoveryRequestGenerator.tsx` into `App.tsx`.
-   **Demand Letter:**
    *   Ensure `DemandLetter.tsx` is fully functional and connected to the analysis data.

### 3. UI/UX Enhancements
-   **Questions Tab:**
    *   Ensure the "Load Pre-Filled Answers" button triggers the enhanced parsing logic.
    *   Verify the "Edit Mode" works as expected.
-   **Navigation:**
    *   Review tab structure to ensure logical flow (Input -> Questions -> Evidence -> Analysis -> Strategy -> Actions).

### 4. Cleanup & Archiving
-   **Action:**
    *   Identify files not used in the current `src` or `public` structure.
    *   Move them to a `_ARCHIVE` directory (added to `.gitignore`).

### 5. Deployment
-   **Action:**
    *   Initialize/Re-point local git to `https://github.com/PMA-PC/legal-case-builder-fresh26Nov.git`.
    *   Commit and push all changes.

## Verification Plan
-   **Data Check:** Load the app, click "Load Pre-Filled Answers", and verify that a significant number of questions (approx 80-90%) now have text in their answer fields.
-   **Generation Check:** Test generating an EEOC complaint and a Discovery Request.
-   **Deployment Check:** Verify the code on GitHub matches the local state.
