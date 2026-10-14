# AE Bridge beta

Public source used to build the Windows companion and credential-free Figma Community package. No machine configuration, keys, generated transfer scripts or user assets are included.

Resources page: https://jherem.vercel.app/resources/ae-bridge

The release workflow downloads the pinned Node.js runtime and verifies its SHA256, builds the installer and attaches it to the versioned GitHub release. The portfolio download route redirects to that release. Add future download listings in src/data/resources.ts.

Support: hectorheredia19@gmail.com
