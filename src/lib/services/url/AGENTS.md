# URL detection boundaries
- Use fixed-origin metadata requests with bounded bodies, timeouts and no redirects; DNS observations never authorize arbitrary HTTP connections because resolution is not pinned.
- Keep controlled page/redirect fixtures offline and distinct from live scanning; this prevents fixture results from becoming fabricated verification.
- Freeze engine hashes and labeled final data before evaluation, and retain every failed case; previously reviewed holdouts are development evidence only.
- Keep operator scanning in a separate explicitly host-authorized POSIX CLI with IP-pinned TLS and a hard process deadline; never expose it as public app egress or treat fixture analysis as live evidence.