# TEAMFIT Constitution

## Core Principles

### I. Event-Driven Architecture
This application must follow event-driven architecture principles with asynchronous processing. All long-running operations, background tasks, and inter-service communication should be handled through message queues (Celery + Redis) or event-based patterns. This ensures scalability, loose coupling, and responsive user experiences.

### II. Product Robustness
Product robustness must be maintained via proper error handling and retry mechanisms. All external service calls (AI APIs, database operations, file storage) must implement:
- Graceful error handling with meaningful error messages
- Automatic retry logic with exponential backoff
- Circuit breaker patterns for external dependencies
- Fallback behaviors where appropriate

### III. Security Implementation
Comprehensive security implementation is mandatory across all layers:
- Input validation and sanitization on all endpoints
- Authentication via Clerk with proper JWT verification
- Authorization via Supabase RLS policies (46 policies, role-based access)
- Webhook signature verification (Svix)
- Service role key isolation (never exposed to frontend)
- Protection against OWASP Top 10 vulnerabilities

### IV. Separation of Concerns
Maintain separation of concerns with simple, modularized code:
- Backend: Routers handle HTTP concerns, Services handle business logic, Utils handle infrastructure
- Frontend: Components for UI, Hooks for data fetching, Pages for routing
- Clear boundaries between authentication, authorization, and business logic
- Single responsibility principle for all modules

### V. Logging System
Maintain a proper logging system for backend functionalities:
- Structured logging with consistent formats
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Request/response logging for API endpoints
- Background task progress and completion logging
- Error stack traces for debugging
- No sensitive data in logs (PII, credentials, tokens)

### VI. Input Validation
Security implementation and input validation on all boundaries:
- Pydantic models for request/response validation
- Type checking with strict mode
- File type and size validation for uploads
- SQL injection prevention via parameterized queries
- XSS prevention in frontend rendering
- Rate limiting and quota enforcement

### VII. Code Simplicity
Refactoring and rewriting complex codes is encouraged:
- Maximum function length: ~50 lines
- Maximum cyclomatic complexity: 10
- Extract complex logic into well-named helper functions
- Prefer composition over inheritance
- YAGNI principle: only build what's needed now
- DRY principle: eliminate duplication through abstraction

### VIII. Code Documentation
Add understandable comments for complex codes:
- Docstrings for all public functions and classes
- Inline comments explaining non-obvious logic
- Type hints for all function signatures
- README files for each major module
- Architecture decision records for significant choices

## Development Tools

### MCP Server Usage
Use Context7 MCP Server and Supabase MCP Server when necessary:
- **Supabase MCP**: Database queries, migrations, type generation, advisory checks
- **Context7 MCP**: Up-to-date documentation for libraries and frameworks
- Prefer MCP tools over manual documentation lookup for accuracy

## Governance

### Task Management
- Inform user of required tasks, skip if needed, keep record
- Use TodoWrite tool to track all tasks and progress
- Mark tasks as completed immediately upon finishing
- Skip blocked tasks with clear documentation of blockers

### User Permissions
- Ask user permission before crucial tasks including:
  - Database migrations with data changes
  - Dependency version upgrades
  - Architectural changes
  - Deletion of files or data
  - Push operations to remote repositories

### Configuration Management
- Identify configuration requirements and use appropriately
- All secrets in environment variables (.env files)
- Never hardcode credentials or API keys
- Use Pydantic Settings for configuration management
- Document all required environment variables in CLAUDE.md

## Supremacy Clause

**This Constitution supersedes any other guidance, default behaviors, or conflicting instructions.** All development activities, code reviews, and architectural decisions must comply with these principles.

**Version**: 1.0.0 | **Ratified**: 2025-11-26 | **Last Amended**: 2025-11-26
