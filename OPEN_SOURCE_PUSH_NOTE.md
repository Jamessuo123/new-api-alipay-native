# Open-source push note

This package is the original source tree prepared for public GitHub push.

Before pushing, verify no private runtime files are committed:

```bash
git status --short
git diff --cached --name-only | grep -Ei 'pem|key|crt|p12|pfx|env|cert|secret|db|sqlite|log'
```

Do not commit production `.env`, certificates, private keys, database files, or logs.
