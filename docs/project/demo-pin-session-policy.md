# Workspace Access Session Policy

The workspace access gate is a controlled review-flow gate for the ER Pod Shift Simulator. It is not production authentication, real security, PHI protection, or source-system access control.

Unlock persistence is limited to the current browser session through `sessionStorage`. The app may store only an unlocked boolean and unlock timestamp. It must not store the access-code input, auth tokens, identity data, PHI, EHR data, clinical notes, diagnosis text, medication names, or employee identifiers.

Closing the tab or browser resets the access gate through browser session semantics. The post-unlock Lock Workspace action clears the session unlock record and returns the app to the workspace access screen.
