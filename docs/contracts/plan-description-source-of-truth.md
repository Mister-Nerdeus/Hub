# Plan Description Source Of Truth

`layout.description` is the canonical plan description.

## API Rules

- API requests may omit top-level `description`.
- When top-level `description` is provided, it must equal `layout.description`.
- Requests with conflicting top-level and layout descriptions are rejected with `400 Bad Request`.
- The database `plans.description` column is populated from `layout.description`.
- API record responses must return `description` equal to `layout.description`.

## Web Rules

- The web API wrapper validates returned plan layouts with the shared contract.
- The wrapper rejects response drift when `response.description` does not equal `response.layout.description`.

This contract does not change the database table shape and does not add report/export behavior.
