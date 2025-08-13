# AGENTS.md - Coding Agent Instructions

## Build/Test Commands
- **Python server**: `python src/server.py` (runs Flask app on port 5000)
- **Dependencies**: Use `uv` package manager (see pyproject.toml)
- **No formal test suite** - test by running server and checking endpoints

## Code Style Guidelines

### Python Files
- Use **snake_case** for variables/functions, **PascalCase** for classes
- **Type hints required** - use `from typing import` and modern syntax
- **Import order**: stdlib, third-party, local (see src/asr.py:1-13)
- Use **pathlib.Path** for file operations, not os.path
- **Docstrings**: Brief one-line for simple functions, detailed for complex classes
- **Constants**: ALL_CAPS with module-level definitions (see Config class)

### Error Handling
- Return structured dictionaries with "status" field for API responses
- Use descriptive error messages in JSON responses
- Prefer early returns over nested if/else blocks

### File Structure
- Keep database access in dedicated classes (QuranDatabase)
- Separate concerns: ASR, text processing, database in different classes
- Use NamedTuple for structured data (VerseInfo, MatchResult)

**Note**: This is a Flask-based Quran ASR app with no formal CI/CD or testing framework.