# Versions

Checked against Claude Code 2.1.316 on 2026-10-31.

CI installs that version for `claude plugin validate`, the dev container installs it, and `make doctor` asks for 2.1.302 or newer. A test keeps the three in line. The nightly watcher opens a `factory:triage` issue when a newer release exists, so the factory keeps the course current.
