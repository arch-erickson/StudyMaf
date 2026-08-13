# Landing page handoff

The new marketing landing page is self-contained at `landing/index.html` and is designed to become the public root page once the existing app shell is moved under an application route (for example `/app/`).

The secure sign-in page is already available at `control/index.html`, which GitHub Pages serves at:

`https://studymaf.com/control/`

The landing buttons link to `/control/` and `/control/?intent=professor`. The professor choice uses the same passwordless sign-in flow, then checks the server-managed role and directs professor/admin accounts to the appropriate private dashboard.

Do not copy the landing page to the root until the current single-page study app has a stable separate route. The migration should preserve the current study experience at `/` while the landing page is reviewed.
